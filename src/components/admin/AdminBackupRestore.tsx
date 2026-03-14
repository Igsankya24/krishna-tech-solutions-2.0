import { useState, useRef } from "react";
import { supabase } from "@/services/database";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, Upload, History, FileJson, AlertTriangle, CheckCircle2, Loader2, Trash2, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface BackupRecord {
  id: string;
  name: string;
  created_at: string;
  record_count: number;
  size_bytes: number;
  tables: string[];
}

interface BackupData {
  meta: {
    version: string;
    created_at: string;
    tables: string[];
    record_count: number;
  };
  data: Record<string, unknown[]>;
}

const BACKUP_TABLES = [
  "services",
  "appointments",
  "coupons",
  "contact_messages",
  "profiles",
  "user_roles",
  "user_access",
  "admin_permissions",
  "notifications",
  "site_settings",
  "technicians",
  "testimonials",
  "team_members",
  "service_projects",
  "blog_posts",
  "blog_categories",
  "blog_tags",
  "blog_post_tags",
  "blog_ads",
  "invoices",
] as const;

const AdminBackupRestore = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Backup state
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);

  // Restore state
  const [restoreFile, setRestoreFile] = useState<BackupData | null>(null);
  const [restoreFileName, setRestoreFileName] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);
  const [confirmRestoreOpen, setConfirmRestoreOpen] = useState(false);

  // History state
  const [backupHistory, setBackupHistory] = useState<BackupRecord[]>(() => {
    try {
      const stored = localStorage.getItem("backup_history");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const saveHistory = (records: BackupRecord[]) => {
    setBackupHistory(records);
    localStorage.setItem("backup_history", JSON.stringify(records));
  };

  // ─── Backup ─────────────────────────────────────────────
  const createBackup = async () => {
    setIsCreatingBackup(true);
    setBackupProgress(0);

    try {
      const backupData: Record<string, unknown[]> = {};
      let totalRecords = 0;

      for (let i = 0; i < BACKUP_TABLES.length; i++) {
        const table = BACKUP_TABLES[i];
        setBackupProgress(Math.round(((i + 1) / BACKUP_TABLES.length) * 100));

        const { data, error } = await supabase
          .from(table)
          .select("*");

        if (error) {
          console.warn(`Skipping table ${table}: ${error.message}`);
          backupData[table] = [];
        } else {
          backupData[table] = data || [];
          totalRecords += (data || []).length;
        }
      }

      const backup: BackupData = {
        meta: {
          version: "1.0.0",
          created_at: new Date().toISOString(),
          tables: [...BACKUP_TABLES],
          record_count: totalRecords,
        },
        data: backupData,
      };

      // Download file
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const fileName = `backup_${format(new Date(), "yyyy-MM-dd_HH-mm-ss")}.json`;
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);

      // Save to history
      const record: BackupRecord = {
        id: crypto.randomUUID(),
        name: fileName,
        created_at: new Date().toISOString(),
        record_count: totalRecords,
        size_bytes: blob.size,
        tables: [...BACKUP_TABLES],
      };
      saveHistory([record, ...backupHistory].slice(0, 50));

      toast({ title: "Backup Created", description: `${totalRecords} records exported across ${BACKUP_TABLES.length} tables.` });
    } catch (err) {
      toast({ title: "Backup Failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsCreatingBackup(false);
      setBackupProgress(0);
    }
  };

  // ─── Restore ────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      toast({ title: "Invalid File", description: "Please upload a .json backup file.", variant: "destructive" });
      return;
    }

    setRestoreFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string) as BackupData;
        if (!parsed.meta || !parsed.data) {
          throw new Error("Invalid backup format: missing meta or data");
        }
        setRestoreFile(parsed);
        toast({ title: "File Loaded", description: `Backup from ${format(new Date(parsed.meta.created_at), "PPpp")} with ${parsed.meta.record_count} records.` });
      } catch (err) {
        toast({ title: "Invalid Backup", description: (err as Error).message, variant: "destructive" });
        setRestoreFile(null);
      }
    };
    reader.readAsText(file);
  };

  const executeRestore = async () => {
    if (!restoreFile) return;
    setIsRestoring(true);
    setConfirmRestoreOpen(false);

    try {
      let restoredCount = 0;
      const errors: string[] = [];

      for (const table of Object.keys(restoreFile.data)) {
        const rows = restoreFile.data[table];
        if (!rows || rows.length === 0) continue;

        // Upsert in batches of 100
        for (let i = 0; i < rows.length; i += 100) {
          const batch = rows.slice(i, i + 100);
          const { error } = await supabase
            .from(table as any)
            .upsert(batch as any[], { onConflict: "id" });

          if (error) {
            errors.push(`${table}: ${error.message}`);
          } else {
            restoredCount += batch.length;
          }
        }
      }

      if (errors.length > 0) {
        toast({
          title: "Restore Completed with Warnings",
          description: `${restoredCount} records restored. ${errors.length} table(s) had errors.`,
          variant: "destructive",
        });
      } else {
        toast({ title: "Restore Complete", description: `${restoredCount} records successfully restored.` });
      }
    } catch (err) {
      toast({ title: "Restore Failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsRestoring(false);
      setRestoreFile(null);
      setRestoreFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const clearHistory = () => {
    saveHistory([]);
    toast({ title: "History Cleared" });
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Backup & Restore</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Create backups of your application data and restore from previous backups.
        </p>
      </div>

      <Tabs defaultValue="backup" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="backup" className="flex items-center gap-2">
            <Download className="w-4 h-4" /> Backup
          </TabsTrigger>
          <TabsTrigger value="restore" className="flex items-center gap-2">
            <Upload className="w-4 h-4" /> Restore
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" /> History
          </TabsTrigger>
        </TabsList>

        {/* ─── Backup Tab ────────────────────────────── */}
        <TabsContent value="backup" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5 text-primary" />
                Create Backup
              </CardTitle>
              <CardDescription>
                Export all application data as a JSON file. This includes services, appointments, users, settings, blog content, and more.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-foreground mb-2">Tables included in backup:</h4>
                <div className="flex flex-wrap gap-2">
                  {BACKUP_TABLES.map((table) => (
                    <span key={table} className="text-xs px-2 py-1 rounded-md bg-background border border-border text-muted-foreground">
                      {table.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>

              {isCreatingBackup && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Exporting data...</span>
                    <span className="font-medium text-foreground">{backupProgress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${backupProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <Button
                onClick={createBackup}
                disabled={isCreatingBackup}
                className="w-full sm:w-auto"
                size="lg"
              >
                {isCreatingBackup ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating Backup...</>
                ) : (
                  <><Download className="w-4 h-4 mr-2" /> Create Backup</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Restore Tab ───────────────────────────── */}
        <TabsContent value="restore" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                Restore from Backup
              </CardTitle>
              <CardDescription>
                Upload a previously exported .json backup file to restore your data. Existing records with matching IDs will be updated.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
                <p className="text-sm text-destructive">
                  <strong>Warning:</strong> Restoring will upsert data. Existing records with matching IDs will be overwritten. This action cannot be undone.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Select Backup File</label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="cursor-pointer"
                />
              </div>

              {restoreFile && (
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <FileJson className="w-5 h-5 text-primary" />
                      <span className="font-medium text-foreground">{restoreFileName}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Created</p>
                        <p className="font-medium">{format(new Date(restoreFile.meta.created_at), "PP")}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Records</p>
                        <p className="font-medium">{restoreFile.meta.record_count.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Tables</p>
                        <p className="font-medium">{restoreFile.meta.tables.length}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Data per table:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(restoreFile.data).map(([table, rows]) => (
                          <span
                            key={table}
                            className="text-xs px-2 py-0.5 rounded bg-background border border-border"
                          >
                            {table.replace(/_/g, " ")} ({(rows as unknown[]).length})
                          </span>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={() => setConfirmRestoreOpen(true)}
                      disabled={isRestoring}
                      variant="destructive"
                      className="w-full sm:w-auto"
                    >
                      {isRestoring ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Restoring...</>
                      ) : (
                        <><RefreshCw className="w-4 h-4 mr-2" /> Restore Data</>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── History Tab ────────────────────────────── */}
        <TabsContent value="history" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5 text-primary" />
                    Backup History
                  </CardTitle>
                  <CardDescription>
                    Previously created backups from this browser session.
                  </CardDescription>
                </div>
                {backupHistory.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearHistory}>
                    <Trash2 className="w-4 h-4 mr-1" /> Clear
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {backupHistory.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>No backup history found.</p>
                  <p className="text-xs mt-1">Create your first backup to see it here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="p-3 text-left text-sm font-medium">Backup Name</th>
                        <th className="p-3 text-left text-sm font-medium">Created Date</th>
                        <th className="p-3 text-left text-sm font-medium">Records</th>
                        <th className="p-3 text-left text-sm font-medium">Size</th>
                      </tr>
                    </thead>
                    <tbody>
                      {backupHistory.map((record) => (
                        <tr key={record.id} className="border-t border-border hover:bg-muted/30">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <FileJson className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium text-foreground">{record.name}</span>
                            </div>
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {format(new Date(record.created_at), "PPpp")}
                          </td>
                          <td className="p-3 text-sm text-foreground font-medium">
                            {record.record_count.toLocaleString()}
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {formatBytes(record.size_bytes)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirm Restore Dialog */}
      <Dialog open={confirmRestoreOpen} onOpenChange={setConfirmRestoreOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Confirm Restore
            </DialogTitle>
            <DialogDescription>
              This will upsert {restoreFile?.meta.record_count.toLocaleString()} records across {restoreFile?.meta.tables.length} tables. Existing records with matching IDs will be overwritten. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmRestoreOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={executeRestore}>
              <CheckCircle2 className="w-4 h-4 mr-2" /> Confirm Restore
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBackupRestore;

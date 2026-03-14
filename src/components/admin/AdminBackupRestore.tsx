import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/services/database";
import { storage } from "@/services/storage";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Download,
  Upload,
  History,
  FileJson,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Trash2,
  RefreshCw,
  BookOpen,
  Database,
  Shield,
  Terminal,
  Info,
  Clock,
  Zap,
} from "lucide-react";
import { format } from "date-fns";

// ─── Types ────────────────────────────────────────────────
interface BackupData {
  meta: {
    version: string;
    created_at: string;
    tables: string[];
    record_count: number;
  };
  data: Record<string, unknown[]>;
}

interface BackupMetadata {
  id: string;
  file_name: string;
  file_size: number;
  record_count: number;
  tables_included: string[];
  status: string;
  backup_type: string;
  created_by: string | null;
  created_at: string;
  error_message: string | null;
}

// ─── Constants ────────────────────────────────────────────
const BACKUP_TABLES = [
  "services", "appointments", "coupons", "contact_messages", "profiles",
  "user_roles", "user_access", "admin_permissions", "notifications",
  "site_settings", "technicians", "testimonials", "team_members",
  "service_projects", "blog_posts", "blog_categories", "blog_tags",
  "blog_post_tags", "blog_ads", "invoices",
] as const;

const BUCKET = "backups";

// ─── Helpers ──────────────────────────────────────────────
const formatBytes = (bytes: number) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ─── Sub-components ───────────────────────────────────────

function BackupTab({
  isCreating,
  progress,
  onCreateBackup,
}: {
  isCreating: boolean;
  progress: number;
  onCreateBackup: () => void;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            Create Backup
          </CardTitle>
          <CardDescription>
            Export all application data as a JSON file and store it securely. Includes services, appointments, users, settings, blog content, and more.
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

          {isCreating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Exporting data...</span>
                <span className="font-medium text-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          <Button onClick={onCreateBackup} disabled={isCreating} className="w-full sm:w-auto" size="lg">
            {isCreating ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating Backup...</>
            ) : (
              <><Download className="w-4 h-4 mr-2" /> Create Backup</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Scheduled backup info */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Automatic Daily Backups</p>
              <p className="text-xs text-muted-foreground">
                Scheduled backups run daily at 2:00 AM UTC. Backup files are stored in secure cloud storage and metadata is logged in the History tab.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RestoreTab({
  restoreFile,
  restoreFileName,
  isRestoring,
  fileInputRef,
  onFileSelect,
  onConfirmRestore,
}: {
  restoreFile: BackupData | null;
  restoreFileName: string;
  isRestoring: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onConfirmRestore: () => void;
}) {
  return (
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
            <strong>Warning:</strong> This action will overwrite existing database data. Existing records with matching IDs will be replaced. This cannot be undone.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Select Backup File</label>
          <Input ref={fileInputRef} type="file" accept=".json" onChange={onFileSelect} className="cursor-pointer" />
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
                    <span key={table} className="text-xs px-2 py-0.5 rounded bg-background border border-border">
                      {table.replace(/_/g, " ")} ({(rows as unknown[]).length})
                    </span>
                  ))}
                </div>
              </div>

              <Button onClick={onConfirmRestore} disabled={isRestoring} variant="destructive" className="w-full sm:w-auto">
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
  );
}

function HistoryTab({
  records,
  loading,
  onRefresh,
  onDownload,
  onDelete,
}: {
  records: BackupMetadata[];
  loading: boolean;
  onRefresh: () => void;
  onDownload: (name: string) => void;
  onDelete: (id: string, fileName: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Backup History
            </CardTitle>
            <CardDescription>All backups including manual and scheduled automatic backups.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <History className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No backups found.</p>
            <p className="text-xs mt-1">Create your first backup to see it here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-3 text-left text-sm font-medium">Backup Name</th>
                  <th className="p-3 text-left text-sm font-medium">Type</th>
                  <th className="p-3 text-left text-sm font-medium">Date Created</th>
                  <th className="p-3 text-left text-sm font-medium">Records</th>
                  <th className="p-3 text-left text-sm font-medium">Size</th>
                  <th className="p-3 text-left text-sm font-medium">Status</th>
                  <th className="p-3 text-right text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <FileJson className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">{record.file_name}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant={record.backup_type === "scheduled" ? "secondary" : "default"} className="text-xs">
                        {record.backup_type === "scheduled" ? (
                          <><Clock className="w-3 h-3 mr-1" /> Scheduled</>
                        ) : (
                          <><Zap className="w-3 h-3 mr-1" /> Manual</>
                        )}
                      </Badge>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {format(new Date(record.created_at), "PPpp")}
                    </td>
                    <td className="p-3 text-sm text-foreground font-medium">
                      {record.record_count.toLocaleString()}
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {formatBytes(record.file_size)}
                    </td>
                    <td className="p-3">
                      <Badge variant={record.status === "completed" ? "default" : "destructive"} className="text-xs">
                        {record.status === "completed" ? (
                          <><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</>
                        ) : (
                          <><AlertTriangle className="w-3 h-3 mr-1" /> Failed</>
                        )}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {record.status === "completed" && (
                          <Button variant="outline" size="sm" onClick={() => onDownload(record.file_name)}>
                            <Download className="w-3.5 h-3.5 mr-1" /> Download
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => onDelete(record.id, record.file_name)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InstructionsTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            How Backup Works
          </CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none text-foreground">
          <p className="text-muted-foreground">
            Backups export application tables from the database and store them in secure cloud storage as JSON files.
            Each backup captures a snapshot of all core tables including services, appointments, users, settings, blog content, invoices, and more.
          </p>
          <p className="text-muted-foreground">
            The backup file is self-contained — it includes metadata (creation date, table list, record count) alongside the raw data, making it easy to validate and restore.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Automatic Daily Backups
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            The system runs an automatic backup every day at <strong className="text-foreground">2:00 AM UTC</strong>. These backups are:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
            <li>Created and uploaded to cloud storage automatically</li>
            <li>Logged in the <strong className="text-foreground">History</strong> tab with a "Scheduled" badge</li>
            <li>Available for download at any time</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            How to Create a Manual Backup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Login as <strong className="text-foreground">Super Admin</strong></li>
            <li>Open the <strong className="text-foreground">Admin Panel</strong></li>
            <li>Navigate to <strong className="text-foreground">Backup & Restore</strong> in the sidebar</li>
            <li>Click <strong className="text-foreground">Create Backup</strong></li>
            <li>Wait for the progress bar to complete</li>
            <li>The backup file is saved to cloud storage and downloaded to your device</li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            How to Restore a Backup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Go to the <strong className="text-foreground">Restore</strong> tab</li>
            <li>Upload a <code className="text-xs bg-muted px-1 py-0.5 rounded">.json</code> backup file</li>
            <li>Review the preview showing tables and record counts</li>
            <li>Click <strong className="text-foreground">Restore Data</strong> and confirm</li>
          </ol>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 mt-3">
            <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
            <p className="text-xs text-destructive">
              Restoring will overwrite existing records with matching IDs. Always create a fresh backup before restoring.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-primary" />
            Full Database Backup (Manual — pg_dump)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            For a complete PostgreSQL backup including schema, functions, triggers, and all data, use <code className="text-xs bg-muted px-1 py-0.5 rounded">pg_dump</code>:
          </p>
          <div className="bg-muted rounded-lg p-4 font-mono text-xs text-foreground overflow-x-auto">
            pg_dump -h db.your-project.supabase.co -U postgres -d postgres &gt; backup.sql
          </div>
          <p className="text-xs text-muted-foreground">
            This creates a full Postgres dump including indexes, constraints, and custom functions. Restore using <code className="bg-muted px-1 py-0.5 rounded">psql</code> or <code className="bg-muted px-1 py-0.5 rounded">pg_restore</code>.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Dashboard Backup (Supabase)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            If your project is hosted on Supabase, automatic backups are available through the Dashboard:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Open the <strong className="text-foreground">Supabase Dashboard</strong></li>
            <li>Go to <strong className="text-foreground">Database → Backups</strong></li>
            <li>Download the latest snapshot</li>
          </ol>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted border border-border mt-2">
            <Shield className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Automatic backup frequency depends on your plan. Free plans include weekly backups; Pro plans include daily backups with point-in-time recovery.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────
const AdminBackupRestore = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);

  const [restoreFile, setRestoreFile] = useState<BackupData | null>(null);
  const [restoreFileName, setRestoreFileName] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);
  const [confirmRestoreOpen, setConfirmRestoreOpen] = useState(false);

  const [backupRecords, setBackupRecords] = useState<BackupMetadata[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // ─── Load backup history from database ──────────────────
  const fetchBackupHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from("backup_metadata" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      setBackupRecords((data as unknown as BackupMetadata[]) || []);
    } catch (err) {
      console.warn("Failed to fetch backup history:", err);
      setBackupRecords([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchBackupHistory();
  }, [fetchBackupHistory]);

  // ─── Create Backup ─────────────────────────────────────
  const createBackup = async () => {
    setIsCreatingBackup(true);
    setBackupProgress(0);

    try {
      const backupData: Record<string, unknown[]> = {};
      let totalRecords = 0;

      for (let i = 0; i < BACKUP_TABLES.length; i++) {
        const table = BACKUP_TABLES[i];
        setBackupProgress(Math.round(((i + 1) / BACKUP_TABLES.length) * 100));

        const { data, error } = await supabase.from(table).select("*");
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

      const jsonStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const fileName = `backup-${format(new Date(), "yyyy-MM-dd-HH-mm")}.json`;

      // Upload to storage
      const { error: uploadError } = await storage.from(BUCKET).upload(fileName, blob, {
        contentType: "application/json",
        upsert: false,
      });

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Save metadata
      await supabase.from("backup_metadata" as any).insert({
        file_name: fileName,
        file_size: jsonStr.length,
        record_count: totalRecords,
        tables_included: [...BACKUP_TABLES],
        status: uploadError ? "failed" : "completed",
        backup_type: "manual",
        created_by: user?.id || null,
        error_message: uploadError?.message || null,
      } as any);

      if (uploadError) {
        console.warn("Storage upload failed:", uploadError.message);
      }

      // Download locally
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: "Backup Created", description: `${totalRecords} records exported across ${BACKUP_TABLES.length} tables.` });
      fetchBackupHistory();
    } catch (err) {
      toast({ title: "Backup Failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsCreatingBackup(false);
      setBackupProgress(0);
    }
  };

  // ─── Handle file selection for restore ─────────────────
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
        if (!parsed.meta || !parsed.data) throw new Error("Invalid backup format: missing meta or data");
        setRestoreFile(parsed);
        toast({ title: "File Loaded", description: `Backup from ${format(new Date(parsed.meta.created_at), "PPpp")} with ${parsed.meta.record_count} records.` });
      } catch (err) {
        toast({ title: "Invalid Backup", description: (err as Error).message, variant: "destructive" });
        setRestoreFile(null);
      }
    };
    reader.readAsText(file);
  };

  // ─── Execute restore ───────────────────────────────────
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

        for (let i = 0; i < rows.length; i += 100) {
          const batch = rows.slice(i, i + 100);
          const { error } = await supabase.from(table as any).upsert(batch as any[], { onConflict: "id" });
          if (error) errors.push(`${table}: ${error.message}`);
          else restoredCount += batch.length;
        }
      }

      if (errors.length > 0) {
        toast({ title: "Restore Completed with Warnings", description: `${restoredCount} records restored. ${errors.length} table(s) had errors.`, variant: "destructive" });
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

  // ─── Download from storage ─────────────────────────────
  const downloadBackup = async (name: string) => {
    const { data, error } = await storage.from(BUCKET).download(name);
    if (error || !data) {
      toast({ title: "Download Failed", description: error?.message || "File not found", variant: "destructive" });
      return;
    }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Delete backup ─────────────────────────────────────
  const deleteBackup = async (id: string, fileName: string) => {
    // Delete from storage (ignore error if file already gone)
    await storage.from(BUCKET).remove([fileName]);
    // Delete metadata
    const { error } = await supabase.from("backup_metadata" as any).delete().eq("id", id);
    if (error) {
      toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Backup Deleted" });
    fetchBackupHistory();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Backup & Restore</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Create backups, restore data, view history, and read instructions.
        </p>
      </div>

      <Tabs defaultValue="backup" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="backup" className="flex items-center gap-2">
            <Download className="w-4 h-4" /> Backup
          </TabsTrigger>
          <TabsTrigger value="restore" className="flex items-center gap-2">
            <Upload className="w-4 h-4" /> Restore
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" /> History
          </TabsTrigger>
          <TabsTrigger value="instructions" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> Instructions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="backup" className="mt-4">
          <BackupTab isCreating={isCreatingBackup} progress={backupProgress} onCreateBackup={createBackup} />
        </TabsContent>

        <TabsContent value="restore" className="mt-4">
          <RestoreTab
            restoreFile={restoreFile}
            restoreFileName={restoreFileName}
            isRestoring={isRestoring}
            fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
            onFileSelect={handleFileSelect}
            onConfirmRestore={() => setConfirmRestoreOpen(true)}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <HistoryTab
            records={backupRecords}
            loading={loadingHistory}
            onRefresh={fetchBackupHistory}
            onDownload={downloadBackup}
            onDelete={deleteBackup}
          />
        </TabsContent>

        <TabsContent value="instructions" className="mt-4">
          <InstructionsTab />
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
              This will upsert {restoreFile?.meta.record_count.toLocaleString()} records across{" "}
              {restoreFile?.meta.tables.length} tables. Existing records with matching IDs will be overwritten. This action cannot be undone.
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

import { useState, useEffect } from "react";
import { ShieldCheck, AlertTriangle, CheckCircle, Database, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/services/database";
import { useToast } from "@/hooks/use-toast";

interface BackupCheck {
  id: string;
  file_name: string;
  created_at: string;
  status: string;
  record_count: number;
  file_size: number;
  integrity: "valid" | "warning" | "error" | "unchecked";
  integrityMessage: string;
}

const AdminBackupChecker = () => {
  const [backups, setBackups] = useState<BackupCheck[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    const { data } = await supabase
      .from("backup_metadata")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) {
      setBackups(data.map(b => ({
        ...b,
        integrity: "unchecked" as const,
        integrityMessage: "Not yet verified",
      })));
    }
  };

  const checkIntegrity = async (backup: BackupCheck) => {
    setIsChecking(true);
    try {
      // Check if file exists in storage
      const { data: files } = await supabase.storage.from("backups").list("", { search: backup.file_name });
      const fileExists = files?.some(f => f.name === backup.file_name);

      setBackups(prev => prev.map(b => b.id === backup.id ? {
        ...b,
        integrity: fileExists ? (backup.status === "completed" ? "valid" : "warning") : "error",
        integrityMessage: fileExists
          ? (backup.status === "completed" ? "File exists and backup completed successfully" : "File exists but backup had issues")
          : "Backup file not found in storage",
      } : b));

      toast({ title: fileExists ? "Backup verified" : "Integrity issue found" });
    } catch (error) {
      console.error("Integrity check error:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const checkAll = async () => {
    for (const backup of backups) {
      await checkIntegrity(backup);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-display">Backup Integrity Checker</h2>
          <p className="text-muted-foreground text-sm mt-1">Verify backup files exist and are valid.</p>
        </div>
        <Button variant="outline" size="sm" onClick={checkAll} disabled={isChecking}>
          <RefreshCw className={`w-4 h-4 mr-1 ${isChecking ? "animate-spin" : ""}`} /> Check All
        </Button>
      </div>

      {backups.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No backups found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {backups.map((backup) => (
            <Card key={backup.id}>
              <CardContent className="p-3 flex items-center gap-3">
                {backup.integrity === "valid" ? <CheckCircle className="w-5 h-5 text-green-500" /> :
                 backup.integrity === "warning" ? <AlertTriangle className="w-5 h-5 text-yellow-500" /> :
                 backup.integrity === "error" ? <AlertTriangle className="w-5 h-5 text-red-500" /> :
                 <Database className="w-5 h-5 text-muted-foreground" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{backup.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(backup.created_at).toLocaleString()} · {backup.record_count} records · {formatSize(backup.file_size)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{backup.integrityMessage}</p>
                </div>
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => checkIntegrity(backup)} disabled={isChecking}>
                  Verify
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminBackupChecker;

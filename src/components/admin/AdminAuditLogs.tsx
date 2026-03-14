import { useState, useEffect } from "react";
import { History, Filter, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entity_id: string;
  user_email: string;
  details: string;
  created_at: string;
}

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filterAction, setFilterAction] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Placeholder data for scaffolding
  useEffect(() => {
    setLogs([
      { id: "1", action: "create", entity: "service", entity_id: "abc", user_email: "admin@example.com", details: "Created service 'Web Development'", created_at: new Date().toISOString() },
      { id: "2", action: "update", entity: "appointment", entity_id: "def", user_email: "admin@example.com", details: "Updated appointment status to confirmed", created_at: new Date(Date.now() - 3600000).toISOString() },
      { id: "3", action: "delete", entity: "coupon", entity_id: "ghi", user_email: "admin@example.com", details: "Deleted expired coupon 'SAVE20'", created_at: new Date(Date.now() - 7200000).toISOString() },
    ]);
  }, []);

  const actionColors: Record<string, string> = {
    create: "bg-green-500/15 text-green-600 dark:text-green-400",
    update: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    delete: "bg-red-500/15 text-red-600 dark:text-red-400",
    login: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-display">Activity & Audit Logs</h2>
          <p className="text-muted-foreground text-sm mt-1">Track all admin actions and system events.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><RefreshCw className="w-4 h-4 mr-1" /> Refresh</Button>
          <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> Export</Button>
        </div>
      </div>

      <div className="flex gap-3">
        <Input placeholder="Search logs..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="max-w-xs" />
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Filter action" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="create">Create</SelectItem>
            <SelectItem value="update">Update</SelectItem>
            <SelectItem value="delete">Delete</SelectItem>
            <SelectItem value="login">Login</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {logs.map((log) => (
              <div key={log.id} className="p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                  <History className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{log.details}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${actionColors[log.action] || "bg-muted text-muted-foreground"}`}>{log.action}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{log.user_email} · {new Date(log.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="bg-muted/50 rounded-xl p-6 text-center">
        <History className="w-10 h-10 mx-auto mb-2 text-muted-foreground opacity-50" />
        <p className="text-sm text-muted-foreground">Full audit logging with database integration coming soon.</p>
        <p className="text-xs text-muted-foreground mt-1">Will track all CRUD operations, logins, and configuration changes.</p>
      </div>
    </div>
  );
};

export default AdminAuditLogs;

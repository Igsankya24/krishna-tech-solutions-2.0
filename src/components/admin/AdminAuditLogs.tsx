import { useState, useEffect, useCallback } from "react";
import { History, Download, RefreshCw, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/services/database";
import { useToast } from "@/hooks/use-toast";

interface AuditLog {
  id: string;
  table_name: string;
  operation: string;
  record_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  user_id: string | null;
  created_at: string;
}

const PAGE_SIZE = 50;

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOperation, setFilterOperation] = useState("all");
  const [filterTable, setFilterTable] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();

  const fetchLogs = useCallback(async (reset = false) => {
    setLoading(true);
    const currentPage = reset ? 0 : page;
    if (reset) setPage(0);

    let query = supabase
      .from("audit_logs" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

    if (filterOperation !== "all") {
      query = query.eq("operation", filterOperation);
    }
    if (filterTable !== "all") {
      query = query.eq("table_name", filterTable);
    }

    const { data, error } = await query;
    if (error) {
      console.warn("Failed to fetch audit logs:", error);
      setLogs([]);
    } else {
      const results = (data as unknown as AuditLog[]) || [];
      setLogs(reset ? results : [...logs, ...results]);
      setHasMore(results.length === PAGE_SIZE);
    }
    setLoading(false);
  }, [filterOperation, filterTable, page]);

  useEffect(() => {
    fetchLogs(true);
  }, [filterOperation, filterTable]);

  const actionColors: Record<string, string> = {
    INSERT: "bg-green-500/15 text-green-600 dark:text-green-400",
    UPDATE: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    DELETE: "bg-red-500/15 text-red-600 dark:text-red-400",
  };

  const filteredLogs = searchQuery
    ? logs.filter(l =>
        l.table_name.includes(searchQuery.toLowerCase()) ||
        l.record_id?.includes(searchQuery) ||
        l.user_id?.includes(searchQuery)
      )
    : logs;

  const exportLogs = () => {
    const csv = [
      ["Timestamp", "Table", "Operation", "Record ID", "User ID"].join(","),
      ...filteredLogs.map(l =>
        [l.created_at, l.table_name, l.operation, l.record_id || "", l.user_id || ""].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `${filteredLogs.length} log entries exported.` });
  };

  const tables = [...new Set(logs.map(l => l.table_name))].sort();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-display">Activity & Audit Logs</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time tracking of all database changes across {tables.length || "all"} monitored tables.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchLogs(true)} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportLogs} disabled={filteredLogs.length === 0}>
            <Download className="w-4 h-4 mr-1" /> Export
          </Button>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Search by table, record ID, or user..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xs"
        />
        <Select value={filterOperation} onValueChange={setFilterOperation}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Operation" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Operations</SelectItem>
            <SelectItem value="INSERT">Insert</SelectItem>
            <SelectItem value="UPDATE">Update</SelectItem>
            <SelectItem value="DELETE">Delete</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterTable} onValueChange={setFilterTable}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Table" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tables</SelectItem>
            {tables.map(t => (
              <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading && filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">No audit logs found</p>
              <p className="text-xs mt-1">Logs will appear here as database changes occur.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredLogs.map((log) => (
                <div key={log.id}>
                  <button
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                    className="w-full p-4 flex items-start gap-3 text-left hover:bg-muted/30 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                      <History className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground">
                          {log.operation.toLowerCase()} on <span className="font-mono text-xs">{log.table_name}</span>
                        </span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${actionColors[log.operation] || "bg-muted text-muted-foreground"}`}>
                          {log.operation}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Record: {log.record_id?.slice(0, 8) || "—"} · {new Date(log.created_at).toLocaleString()}
                        {log.user_id && <> · User: {log.user_id.slice(0, 8)}…</>}
                      </p>
                    </div>
                    {(log.old_data || log.new_data) && (
                      expandedId === log.id
                        ? <ChevronUp className="w-4 h-4 text-muted-foreground mt-1" />
                        : <ChevronDown className="w-4 h-4 text-muted-foreground mt-1" />
                    )}
                  </button>
                  {expandedId === log.id && (log.old_data || log.new_data) && (
                    <div className="px-4 pb-4 pl-[3.25rem]">
                      <div className="bg-muted/50 rounded-lg p-3 text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto space-y-2">
                        {log.old_data && (
                          <div>
                            <p className="text-destructive font-sans font-medium text-[11px] mb-1">Old Data:</p>
                            <pre className="text-muted-foreground whitespace-pre-wrap">{JSON.stringify(log.old_data, null, 2)}</pre>
                          </div>
                        )}
                        {log.new_data && (
                          <div>
                            <p className="text-green-600 dark:text-green-400 font-sans font-medium text-[11px] mb-1">New Data:</p>
                            <pre className="text-muted-foreground whitespace-pre-wrap">{JSON.stringify(log.new_data, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {hasMore && filteredLogs.length > 0 && (
        <div className="text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setPage(p => p + 1); fetchLogs(); }}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
            Load More
          </Button>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLogs;

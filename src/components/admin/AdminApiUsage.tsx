import { useState, useEffect } from "react";
import { Activity, Database, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const AdminApiUsage = () => {
  const [usage] = useState({
    dbRequests: 1247,
    storageUsed: 45.2,
    storageLimit: 1000,
    authUsers: 23,
    realtimeConnections: 3,
    edgeFunctionInvocations: 156,
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground font-display">API Usage Dashboard</h2>
        <p className="text-muted-foreground text-sm mt-1">Monitor backend API usage and resource consumption.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">DB Requests (24h)</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{usage.dbRequests.toLocaleString()}</p>
        </CardContent></Card>

        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-accent" />
            <span className="text-xs text-muted-foreground">Edge Functions (24h)</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{usage.edgeFunctionInvocations}</p>
        </CardContent></Card>

        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight className="w-4 h-4 text-green-500" />
            <span className="text-xs text-muted-foreground">Realtime Connections</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{usage.realtimeConnections}</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Storage Usage</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{usage.storageUsed} MB used</span>
              <span className="text-muted-foreground">{usage.storageLimit} MB limit</span>
            </div>
            <Progress value={(usage.storageUsed / usage.storageLimit) * 100} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Auth Users</CardTitle></CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-foreground">{usage.authUsers}</p>
          <p className="text-xs text-muted-foreground">Registered users across all roles</p>
        </CardContent>
      </Card>

      <div className="bg-muted/50 rounded-xl p-6 text-center">
        <Activity className="w-10 h-10 mx-auto mb-2 text-muted-foreground opacity-50" />
        <p className="text-sm text-muted-foreground">Detailed API usage metrics with historical trends coming soon.</p>
      </div>
    </div>
  );
};

export default AdminApiUsage;

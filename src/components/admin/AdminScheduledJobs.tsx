import { useState } from "react";
import { Clock, Play, Pause, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ScheduledJob {
  id: string;
  name: string;
  schedule: string;
  lastRun: string | null;
  nextRun: string;
  status: "active" | "paused" | "error";
  description: string;
}

const AdminScheduledJobs = () => {
  const [jobs] = useState<ScheduledJob[]>([
    { id: "1", name: "Daily Backup", schedule: "0 2 * * *", lastRun: new Date(Date.now() - 86400000).toISOString(), nextRun: new Date(Date.now() + 43200000).toISOString(), status: "active", description: "Automated daily database backup at 2:00 AM UTC" },
    { id: "2", name: "Expired Coupon Cleanup", schedule: "0 0 * * *", lastRun: new Date(Date.now() - 86400000).toISOString(), nextRun: new Date(Date.now() + 86400000).toISOString(), status: "active", description: "Deactivate coupons past their expiry date" },
    { id: "3", name: "Session Cleanup", schedule: "0 */6 * * *", lastRun: new Date(Date.now() - 21600000).toISOString(), nextRun: new Date(Date.now() + 21600000).toISOString(), status: "active", description: "Remove inactive sessions older than 30 days" },
  ]);

  const statusConfig = {
    active: { label: "Active", color: "bg-green-500/15 text-green-600 dark:text-green-400", icon: CheckCircle },
    paused: { label: "Paused", color: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400", icon: Pause },
    error: { label: "Error", color: "bg-red-500/15 text-red-600 dark:text-red-400", icon: XCircle },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-display">Scheduled Jobs Manager</h2>
          <p className="text-muted-foreground text-sm mt-1">View and manage automated scheduled tasks.</p>
        </div>
        <Button variant="outline" size="sm"><RefreshCw className="w-4 h-4 mr-1" /> Refresh</Button>
      </div>

      <div className="space-y-3">
        {jobs.map((job) => {
          const config = statusConfig[job.status];
          const StatusIcon = config.icon;
          return (
            <Card key={job.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{job.name}</p>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${config.color}`}>{config.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{job.description}</p>
                  <div className="flex gap-4 mt-1 text-[10px] text-muted-foreground">
                    <span>Schedule: <code className="font-mono">{job.schedule}</code></span>
                    {job.lastRun && <span>Last: {new Date(job.lastRun).toLocaleString()}</span>}
                    <span>Next: {new Date(job.nextRun).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="bg-muted/50 rounded-xl p-6 text-center">
        <Clock className="w-10 h-10 mx-auto mb-2 text-muted-foreground opacity-50" />
        <p className="text-sm text-muted-foreground">Job management is powered by pg_cron. Custom job creation coming soon.</p>
      </div>
    </div>
  );
};

export default AdminScheduledJobs;

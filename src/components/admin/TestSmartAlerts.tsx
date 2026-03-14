import { useState } from "react";
import { Bell, AlertTriangle, CheckCircle2, Info, XCircle, Clock, Filter, Volume2, VolumeX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Alert {
  id: string;
  title: string;
  message: string;
  severity: "critical" | "warning" | "info" | "success";
  timestamp: Date;
  acknowledged: boolean;
  source: string;
}

const mockAlerts: Alert[] = [
  { id: "1", title: "High CPU Usage Detected", message: "Server CPU usage exceeded 90% for more than 5 minutes", severity: "critical", timestamp: new Date(Date.now() - 120000), acknowledged: false, source: "System Monitor" },
  { id: "2", title: "Failed Login Attempts", message: "15 failed login attempts from IP 192.168.1.100", severity: "warning", timestamp: new Date(Date.now() - 300000), acknowledged: false, source: "Security" },
  { id: "3", title: "Backup Completed", message: "Scheduled backup completed successfully (2.3GB)", severity: "success", timestamp: new Date(Date.now() - 600000), acknowledged: true, source: "Backup Service" },
  { id: "4", title: "New User Registration Spike", message: "30% increase in user registrations in the last hour", severity: "info", timestamp: new Date(Date.now() - 900000), acknowledged: true, source: "Analytics" },
  { id: "5", title: "Database Connection Pool Low", message: "Available connections dropped below 20%", severity: "warning", timestamp: new Date(Date.now() - 1200000), acknowledged: false, source: "Database" },
  { id: "6", title: "SSL Certificate Expiring", message: "SSL certificate expires in 14 days", severity: "warning", timestamp: new Date(Date.now() - 3600000), acknowledged: false, source: "Security" },
];

const alertRules = [
  { label: "CPU Usage > 90%", enabled: true, channel: "Email + Dashboard" },
  { label: "Failed Login > 10/hour", enabled: true, channel: "Dashboard" },
  { label: "Database Connection < 20%", enabled: true, channel: "Email" },
  { label: "New User Spike > 25%", enabled: false, channel: "Dashboard" },
  { label: "API Error Rate > 5%", enabled: true, channel: "Email + SMS" },
];

const severityConfig = {
  critical: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30", badge: "destructive" as const },
  warning: { icon: AlertTriangle, color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30", badge: "secondary" as const },
  info: { icon: Info, color: "text-primary", bg: "bg-primary/10", border: "border-primary/30", badge: "default" as const },
  success: { icon: CheckCircle2, color: "text-green-600 dark:text-green-400", bg: "bg-green-500/10", border: "border-green-500/30", badge: "outline" as const },
};

const TestSmartAlerts = () => {
  const [alerts, setAlerts] = useState(mockAlerts);
  const [filter, setFilter] = useState<string>("all");
  const [rules, setRules] = useState(alertRules);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const filteredAlerts = filter === "all" ? alerts : alerts.filter(a => a.severity === filter);
  const unacknowledged = alerts.filter(a => !a.acknowledged).length;

  const acknowledgeAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
  };

  const toggleRule = (index: number) => {
    setRules(prev => prev.map((r, i) => i === index ? { ...r, enabled: !r.enabled } : r));
  };

  const formatTime = (date: Date) => {
    const diff = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ago`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-display flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            Smart Alerts System
          </h2>
          <p className="text-muted-foreground mt-1">Intelligent monitoring and alerting</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-foreground" /> : <VolumeX className="w-5 h-5 text-muted-foreground" />}
          </button>
          {unacknowledged > 0 && (
            <Badge variant="destructive">{unacknowledged} unread</Badge>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(["critical", "warning", "info", "success"] as const).map((sev) => {
          const config = severityConfig[sev];
          const count = alerts.filter(a => a.severity === sev).length;
          const Icon = config.icon;
          return (
            <Card key={sev} className={`${config.bg} border ${config.border}`}>
              <CardContent className="p-4 flex items-center gap-3">
                <Icon className={`w-8 h-8 ${config.color}`} />
                <div>
                  <p className="text-2xl font-bold text-foreground">{count}</p>
                  <p className="text-xs text-muted-foreground capitalize">{sev}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alert Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">Alert Feed</h3>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="w-3.5 h-3.5 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Alerts</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Success</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredAlerts.map((alert) => {
            const config = severityConfig[alert.severity];
            const Icon = config.icon;
            return (
              <Card key={alert.id} className={`${!alert.acknowledged ? config.bg + " border " + config.border : ""} transition-all`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 mt-0.5 ${config.color} flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-semibold text-foreground">{alert.title}</h4>
                        <Badge variant={config.badge} className="text-[10px]">{alert.severity}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatTime(alert.timestamp)}
                        </span>
                        <span className="text-[11px] text-muted-foreground">Source: {alert.source}</span>
                      </div>
                    </div>
                    {!alert.acknowledged && (
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex-shrink-0"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Alert Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alert Rules</CardTitle>
            <CardDescription>Configure alert triggers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {rules.map((rule, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex-1 mr-3">
                  <p className="text-sm font-medium text-foreground">{rule.label}</p>
                  <p className="text-[11px] text-muted-foreground">{rule.channel}</p>
                </div>
                <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(i)} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestSmartAlerts;

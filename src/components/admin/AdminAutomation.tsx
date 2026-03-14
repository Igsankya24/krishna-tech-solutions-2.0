import { useState } from "react";
import { Zap, Plus, Play, Pause, Trash2, Clock, Mail, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  isActive: boolean;
  lastRun: string | null;
  runCount: number;
}

const AdminAutomation = () => {
  const [rules, setRules] = useState<AutomationRule[]>([
    { id: "1", name: "Auto-confirm appointments", trigger: "New appointment created", action: "Send confirmation email", isActive: true, lastRun: new Date().toISOString(), runCount: 45 },
    { id: "2", name: "Welcome new users", trigger: "User registration", action: "Send welcome notification", isActive: true, lastRun: new Date(Date.now() - 86400000).toISOString(), runCount: 12 },
    { id: "3", name: "Expired coupon cleanup", trigger: "Daily at midnight", action: "Deactivate expired coupons", isActive: false, lastRun: null, runCount: 0 },
    { id: "4", name: "Appointment reminder", trigger: "24 hours before appointment", action: "Send reminder notification", isActive: true, lastRun: new Date(Date.now() - 43200000).toISOString(), runCount: 89 },
  ]);

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
  };

  const triggerIcons: Record<string, typeof Clock> = {
    "New appointment created": Clock,
    "User registration": Bell,
    "Daily at midnight": Clock,
    "24 hours before appointment": Mail,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-display">Automation Rules</h2>
          <p className="text-muted-foreground text-sm mt-1">Configure automated workflows and triggers.</p>
        </div>
        <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Rule</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{rules.length}</p>
          <p className="text-xs text-muted-foreground">Total Rules</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{rules.filter(r => r.isActive).length}</p>
          <p className="text-xs text-muted-foreground">Active</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{rules.reduce((a, r) => a + r.runCount, 0)}</p>
          <p className="text-xs text-muted-foreground">Total Executions</p>
        </CardContent></Card>
      </div>

      <div className="space-y-3">
        {rules.map((rule) => (
          <Card key={rule.id} className={!rule.isActive ? "opacity-60" : ""}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{rule.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  <span className="font-medium">When:</span> {rule.trigger} → <span className="font-medium">Then:</span> {rule.action}
                </p>
                {rule.lastRun && <p className="text-[10px] text-muted-foreground mt-1">Last run: {new Date(rule.lastRun).toLocaleString()} · Runs: {rule.runCount}</p>}
              </div>
              <Switch checked={rule.isActive} onCheckedChange={() => toggleRule(rule.id)} />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-muted/50 rounded-xl p-6 text-center">
        <Zap className="w-10 h-10 mx-auto mb-2 text-muted-foreground opacity-50" />
        <p className="text-sm text-muted-foreground">Custom automation rules with database-backed triggers coming soon.</p>
      </div>
    </div>
  );
};

export default AdminAutomation;

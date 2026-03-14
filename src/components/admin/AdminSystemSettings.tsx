import { useState, useEffect } from "react";
import { Settings, Save, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/services/database";
import { useToast } from "@/hooks/use-toast";

interface SystemSetting {
  key: string;
  value: string;
  label: string;
  type: "text" | "number" | "boolean";
  description: string;
}

const SYSTEM_SETTINGS: Omit<SystemSetting, "value">[] = [
  { key: "idle_timeout_minutes", label: "Idle Timeout (minutes)", type: "number", description: "Auto-logout after inactivity" },
  { key: "maintenance_mode", label: "Maintenance Mode", type: "boolean", description: "Put the site in maintenance mode" },
  { key: "site_name", label: "Site Name", type: "text", description: "Name shown in browser title" },
  { key: "contact_email", label: "Contact Email", type: "text", description: "Admin contact email address" },
  { key: "max_appointments_per_day", label: "Max Appointments/Day", type: "number", description: "Limit daily bookings" },
  { key: "booking_advance_days", label: "Booking Advance (days)", type: "number", description: "How far ahead users can book" },
  { key: "auto_approve_users", label: "Auto-Approve Users", type: "boolean", description: "Automatically approve new registrations" },
];

const AdminSystemSettingsCenter = () => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    const { data } = await supabase.from("site_settings").select("key, value");
    const existing = data || [];

    setSettings(SYSTEM_SETTINGS.map(s => {
      const found = existing.find(e => e.key === s.key);
      return { ...s, value: found?.value || (s.type === "boolean" ? "false" : s.type === "number" ? "15" : "") };
    }));
    setIsLoading(false);
  };

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
  };

  const saveAll = async () => {
    setIsSaving(true);
    try {
      for (const setting of settings) {
        await supabase.from("site_settings").upsert({ key: setting.key, value: setting.value }, { onConflict: "key" });
      }
      toast({ title: "Settings saved" });
    } catch (error) {
      toast({ title: "Error saving", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-display">System Settings Center</h2>
          <p className="text-muted-foreground text-sm mt-1">Configure global application settings.</p>
        </div>
        <Button onClick={saveAll} disabled={isSaving}>
          <Save className="w-4 h-4 mr-1" /> {isSaving ? "Saving..." : "Save All"}
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" /></div>
      ) : (
        <div className="space-y-3">
          {settings.map((setting) => (
            <Card key={setting.key}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{setting.label}</p>
                  <p className="text-xs text-muted-foreground">{setting.description}</p>
                  <p className="text-[10px] font-mono text-muted-foreground mt-1">{setting.key}</p>
                </div>
                {setting.type === "boolean" ? (
                  <Switch
                    checked={setting.value === "true"}
                    onCheckedChange={(checked) => updateSetting(setting.key, checked ? "true" : "false")}
                  />
                ) : setting.type === "number" ? (
                  <Input
                    type="number"
                    value={setting.value}
                    onChange={(e) => updateSetting(setting.key, e.target.value)}
                    className="w-24"
                  />
                ) : (
                  <Input
                    value={setting.value}
                    onChange={(e) => updateSetting(setting.key, e.target.value)}
                    className="w-48"
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSystemSettingsCenter;

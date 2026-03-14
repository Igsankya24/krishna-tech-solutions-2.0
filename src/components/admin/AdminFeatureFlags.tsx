import { useState, useEffect } from "react";
import { ToggleLeft, Plus, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/services/database";
import { useToast } from "@/hooks/use-toast";

interface FeatureFlag {
  key: string;
  value: string;
  label: string;
  description: string;
}

const DEFAULT_FLAGS: { key: string; label: string; description: string }[] = [
  { key: "feature_chatbot_enabled", label: "Chatbot", description: "Enable/disable the AI chatbot on the website" },
  { key: "feature_guest_booking", label: "Guest Booking", description: "Allow non-authenticated users to book appointments" },
  { key: "feature_blog_enabled", label: "Blog", description: "Show/hide the blog section on the website" },
  { key: "feature_testimonials_enabled", label: "Testimonials", description: "Show/hide the testimonials section" },
  { key: "feature_contact_form", label: "Contact Form", description: "Enable/disable the contact form" },
  { key: "feature_coupons_enabled", label: "Coupons", description: "Enable/disable coupon system for bookings" },
  { key: "feature_payment_enabled", label: "Online Payment", description: "Enable/disable online payment integration" },
];

const AdminFeatureFlags = () => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    setIsLoading(true);
    const { data } = await supabase.from("site_settings").select("key, value").like("key", "feature_%");
    
    const existing = data || [];
    const flagList = DEFAULT_FLAGS.map(def => {
      const found = existing.find(e => e.key === def.key);
      return { key: def.key, value: found?.value || "false", label: def.label, description: def.description };
    });
    setFlags(flagList);
    setIsLoading(false);
  };

  const toggleFlag = async (key: string, currentValue: string) => {
    const newValue = currentValue === "true" ? "false" : "true";
    
    // Optimistic update
    setFlags(prev => prev.map(f => f.key === key ? { ...f, value: newValue } : f));

    const { error } = await supabase.from("site_settings").upsert({ key, value: newValue }, { onConflict: "key" });
    if (error) {
      setFlags(prev => prev.map(f => f.key === key ? { ...f, value: currentValue } : f));
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `${key.replace("feature_", "").replace(/_/g, " ")} ${newValue === "true" ? "enabled" : "disabled"}` });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-display">Feature Flags Manager</h2>
          <p className="text-muted-foreground text-sm mt-1">Toggle features on/off without deploying code.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchFlags}><RefreshCw className="w-4 h-4 mr-1" /> Refresh</Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" /></div>
      ) : (
        <div className="space-y-3">
          {flags.map((flag) => (
            <Card key={flag.key}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <ToggleLeft className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{flag.label}</p>
                    <Badge variant={flag.value === "true" ? "default" : "secondary"} className="text-[10px]">
                      {flag.value === "true" ? "ON" : "OFF"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{flag.description}</p>
                  <p className="text-[10px] font-mono text-muted-foreground mt-1">{flag.key}</p>
                </div>
                <Switch checked={flag.value === "true"} onCheckedChange={() => toggleFlag(flag.key, flag.value)} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminFeatureFlags;

import { useState, useEffect } from "react";
import { Brain, TrendingUp, TrendingDown, AlertCircle, Lightbulb, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/services/database";

interface Insight {
  id: string;
  type: "trend" | "alert" | "suggestion";
  title: string;
  description: string;
  metric?: string;
}

const AdminAIInsights = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const generateInsights = async () => {
    setIsAnalyzing(true);
    try {
      // Gather data for insights
      const [appointments, users, services, messages] = await Promise.all([
        supabase.from("appointments").select("status, appointment_date, created_at").order("created_at", { ascending: false }).limit(100),
        supabase.from("profiles").select("created_at, is_approved").order("created_at", { ascending: false }).limit(100),
        supabase.from("services").select("name, is_active, is_visible"),
        supabase.from("contact_messages").select("created_at, is_read").order("created_at", { ascending: false }).limit(50),
      ]);

      const generatedInsights: Insight[] = [];

      // Appointment insights
      const pending = appointments.data?.filter(a => a.status === "pending").length || 0;
      const total = appointments.data?.length || 0;
      if (pending > total * 0.3) {
        generatedInsights.push({
          id: "1", type: "alert", title: "High Pending Rate",
          description: `${Math.round((pending / total) * 100)}% of recent appointments are still pending. Consider reviewing and confirming them.`,
          metric: `${pending}/${total}`
        });
      }

      // User growth insights
      const recentUsers = users.data?.filter(u => {
        const created = new Date(u.created_at!);
        return created > new Date(Date.now() - 7 * 86400000);
      }).length || 0;
      generatedInsights.push({
        id: "2", type: "trend", title: "User Registrations This Week",
        description: `${recentUsers} new users registered in the last 7 days.`,
        metric: `${recentUsers}`
      });

      // Unapproved users
      const unapproved = users.data?.filter(u => !u.is_approved).length || 0;
      if (unapproved > 0) {
        generatedInsights.push({
          id: "3", type: "alert", title: "Users Awaiting Approval",
          description: `${unapproved} users are waiting for account approval.`,
          metric: `${unapproved}`
        });
      }

      // Unread messages
      const unread = messages.data?.filter(m => !m.is_read).length || 0;
      if (unread > 5) {
        generatedInsights.push({
          id: "4", type: "suggestion", title: "Unread Messages Piling Up",
          description: `You have ${unread} unread messages. Consider setting up auto-responses to improve response time.`,
        });
      }

      // Service suggestions
      const inactiveServices = services.data?.filter(s => !s.is_active || !s.is_visible).length || 0;
      if (inactiveServices > 0) {
        generatedInsights.push({
          id: "5", type: "suggestion", title: "Inactive Services",
          description: `${inactiveServices} services are inactive or hidden. Review if they should be reactivated or removed.`,
        });
      }

      setInsights(generatedInsights);
    } catch (error) {
      console.error("Error generating insights:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    generateInsights();
  }, []);

  const typeConfig = {
    trend: { icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/10" },
    alert: { icon: AlertCircle, color: "text-yellow-500", bg: "bg-yellow-500/10" },
    suggestion: { icon: Lightbulb, color: "text-green-500", bg: "bg-green-500/10" },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-display">AI Insights Dashboard</h2>
          <p className="text-muted-foreground text-sm mt-1">Data-driven insights and recommendations for your business.</p>
        </div>
        <Button variant="outline" size="sm" onClick={generateInsights} disabled={isAnalyzing}>
          <RefreshCw className={`w-4 h-4 mr-1 ${isAnalyzing ? "animate-spin" : ""}`} /> {isAnalyzing ? "Analyzing..." : "Refresh"}
        </Button>
      </div>

      {/* AI Banner */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center">
            <Brain className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Intelligent Analysis</h3>
            <p className="text-sm text-muted-foreground">Analyzing patterns from your appointments, users, services, and messages.</p>
          </div>
        </CardContent>
      </Card>

      {insights.length === 0 && !isAnalyzing ? (
        <div className="text-center py-12 text-muted-foreground">
          <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No insights available. Click Refresh to analyze your data.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {insights.map((insight) => {
            const config = typeConfig[insight.type];
            const Icon = config.icon;
            return (
              <Card key={insight.id}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{insight.title}</p>
                      {insight.metric && <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{insight.metric}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminAIInsights;

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Calendar, Settings, LogOut, Briefcase, Ticket,
  Menu, X, Bell, Check, MessageSquare, UserCircle, Bot, FileText,
  Wrench, Users, ShieldAlert, StickyNote, Search, Sparkles,
} from "lucide-react";
import AdminServices from "@/components/admin/AdminServices";
import AdminSettings from "@/components/admin/AdminSettings";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminCoupons from "@/components/admin/AdminCoupons";
import AdminAppointments from "@/components/admin/AdminAppointments";
import AdminMessages from "@/components/admin/AdminMessages";
import AdminProfileSettings from "@/components/admin/AdminProfileSettings";
import AdminBot from "@/components/admin/AdminBot";
import AdminInvoices from "@/components/admin/AdminInvoices";
import AdminTechnicians from "@/components/admin/AdminTechnicians";
import AdminServiceProjects from "@/components/admin/AdminServiceProjects";
import AdminUserAccess from "@/components/admin/AdminUserAccess";
import AdminSmartSearch from "@/components/admin/AdminSmartSearch";
import AdminNotes from "@/components/admin/AdminNotes";
import AdminQuickActions from "@/components/admin/AdminQuickActions";
import AdminHeaderSearch from "@/components/admin/AdminHeaderSearch";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/services/database";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog, AlertDialogAction, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type AdminTab = "dashboard" | "appointments" | "users" | "services" | "service-projects" | "coupons" | "messages" | "bot" | "settings" | "profile" | "invoices" | "technicians" | "user-access" | "smart-search" | "admin-notes" | "quick-actions";

interface DashboardStats {
  totalUsers: number;
  totalServices: number;
  activeServices: number;
  totalAppointments: number;
  pendingAppointments: number;
  totalCoupons: number;
  totalMessages: number;
  unreadMessages: number;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedAppointmentForInvoice, setSelectedAppointmentForInvoice] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0, totalServices: 0, activeServices: 0,
    totalAppointments: 0, pendingAppointments: 0,
    totalCoupons: 0, totalMessages: 0, unreadMessages: 0,
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const shownNotificationIdsRef = useRef<Set<string>>(new Set());
  const [accessDeniedOpen, setAccessDeniedOpen] = useState(false);
  const { user, isAdmin, isSuperAdmin, isLoading, signOut, permissions } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate("/");
  }, [signOut, navigate]);

  const [idleTimeoutMinutes, setIdleTimeoutMinutes] = useState<number>(60);
  
  useEffect(() => {
    const fetchIdleTimeout = async () => {
      const { data } = await supabase.from("site_settings").select("value").eq("key", "idle_timeout_minutes").single();
      if (data?.value) setIdleTimeoutMinutes(parseInt(data.value) || 60);
    };
    fetchIdleTimeout();
  }, []);

  useIdleTimeout({ timeout: idleTimeoutMinutes * 60 * 1000, onTimeout: handleSignOut, enabled: !!user });

  useEffect(() => {
    if (!isLoading && !user) navigate("/auth");
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (!isLoading && user && !isAdmin) setAccessDeniedOpen(true);
  }, [isAdmin, isLoading, user]);

  // If super_admin lands here, redirect them to /super-admin
  useEffect(() => {
    if (!isLoading && user && isSuperAdmin) navigate("/super-admin");
  }, [isSuperAdmin, isLoading, user, navigate]);

  const fetchStats = useCallback(async () => {
    const [usersRes, servicesRes, appointmentsRes, couponsRes, messagesRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("services").select("id, is_active"),
      supabase.from("appointments").select("id, status"),
      supabase.from("coupons").select("id", { count: "exact", head: true }),
      supabase.from("contact_messages").select("id, is_read"),
    ]);
    setStats({
      totalUsers: usersRes.count || 0,
      totalServices: servicesRes.data?.length || 0,
      activeServices: servicesRes.data?.filter(s => s.is_active).length || 0,
      totalAppointments: appointmentsRes.data?.length || 0,
      pendingAppointments: appointmentsRes.data?.filter(a => a.status === "pending").length || 0,
      totalCoupons: couponsRes.count || 0,
      totalMessages: messagesRes.data?.length || 0,
      unreadMessages: messagesRes.data?.filter(m => !m.is_read).length || 0,
    });
  }, []);

  const fetchNotifications = useCallback(async () => {
    const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(20);
    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
      data.forEach(n => shownNotificationIdsRef.current.add(n.id));
    }
  }, []);

  useEffect(() => {
    if (isAdmin) { fetchStats(); fetchNotifications(); }
  }, [isAdmin, user?.id]);

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleNavigateToInvoice = (appointmentId: string) => {
    setSelectedAppointmentForInvoice(appointmentId);
    setActiveTab("invoices");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <AlertDialog open={accessDeniedOpen} onOpenChange={setAccessDeniedOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <ShieldAlert className="w-8 h-8 text-destructive" />
            </div>
            <AlertDialogTitle className="text-center">Access Restricted</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              You don't have permission to access the admin panel. Contact your administrator.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogAction onClick={() => { setAccessDeniedOpen(false); navigate("/dashboard"); }}>
              Go to Dashboard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  const tabs = [
    { id: "dashboard" as AdminTab, label: "Dashboard", icon: LayoutDashboard, visible: true },
    { id: "services" as AdminTab, label: "Services", icon: Briefcase, visible: permissions.can_view_services },
    { id: "service-projects" as AdminTab, label: "Service Projects", icon: Briefcase, visible: permissions.can_view_services },
    { id: "appointments" as AdminTab, label: "Appointments", icon: Calendar, visible: permissions.can_view_appointments },
    { id: "invoices" as AdminTab, label: "Invoices", icon: FileText, visible: permissions.can_view_appointments },
    { id: "technicians" as AdminTab, label: "Technicians", icon: Wrench, visible: permissions.can_view_appointments },
    { id: "messages" as AdminTab, label: "Messages", icon: MessageSquare, visible: permissions.can_view_messages, badge: stats.unreadMessages > 0 ? stats.unreadMessages : undefined },
    { id: "users" as AdminTab, label: "Users", icon: Users, visible: permissions.can_view_users },
    { id: "user-access" as AdminTab, label: "User Access", icon: Users, visible: permissions.can_manage_users },
    { id: "coupons" as AdminTab, label: "Coupons", icon: Ticket, visible: permissions.can_view_coupons },
    { id: "bot" as AdminTab, label: "Bot Settings", icon: Bot, visible: permissions.can_view_settings },
    { id: "smart-search" as AdminTab, label: "Smart Search", icon: Search, visible: true },
    { id: "quick-actions" as AdminTab, label: "Quick Actions", icon: Sparkles, visible: true },
    { id: "admin-notes" as AdminTab, label: "Notes", icon: StickyNote, visible: true },
    { id: "profile" as AdminTab, label: "My Profile", icon: UserCircle, visible: true },
    { id: "settings" as AdminTab, label: "Settings", icon: Settings, visible: permissions.can_view_settings },
  ].filter(t => t.visible);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-8">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-accent p-6 md:p-8 text-primary-foreground">
              <div className="relative z-10">
                <h2 className="text-2xl md:text-3xl font-bold font-display">Welcome, Admin! 👋</h2>
                <p className="mt-2 text-primary-foreground/80 text-sm md:text-base max-w-xl">
                  Manage services, appointments, and platform operations from here.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Users", value: stats.totalUsers, icon: Users },
                { label: "Appointments", value: stats.totalAppointments, icon: Calendar },
                { label: "Services", value: stats.totalServices, icon: Briefcase },
                { label: "Messages", value: stats.totalMessages, icon: MessageSquare },
              ].map((stat) => (
                <div key={stat.label} className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <stat.icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{stat.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground"><AnimatedNumber value={stat.value} /></p>
                </div>
              ))}
            </div>
          </div>
        );
      case "services": return <AdminServices />;
      case "service-projects": return <AdminServiceProjects />;
      case "appointments": return <AdminAppointments onNavigateToInvoice={handleNavigateToInvoice} />;
      case "invoices": return <AdminInvoices preSelectedAppointmentId={selectedAppointmentForInvoice} onClearSelection={() => setSelectedAppointmentForInvoice(null)} isSuperAdmin={false} />;
      case "technicians": return <AdminTechnicians />;
      case "users": return <AdminUsers />;
      case "user-access": return <AdminUserAccess />;
      case "coupons": return <AdminCoupons />;
      case "messages": return <AdminMessages onUnreadCountChange={(count) => setStats(prev => ({ ...prev, unreadMessages: count }))} />;
      case "bot": return <AdminBot />;
      case "smart-search": return <AdminSmartSearch onNavigate={(tab) => setActiveTab(tab as AdminTab)} />;
      case "quick-actions": return <AdminQuickActions onNavigate={(tab) => setActiveTab(tab as AdminTab)} />;
      case "admin-notes": return <AdminNotes />;
      case "profile": return <AdminProfileSettings />;
      case "settings": return <AdminSettings />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {!sidebarOpen && (
        <button onClick={() => setSidebarOpen(true)} className="md:hidden fixed top-3.5 left-3.5 z-50 p-2.5 bg-card rounded-xl border border-border shadow-sm">
          <Menu className="w-5 h-5" />
        </button>
      )}

      <aside className={`fixed inset-y-0 left-0 z-40 w-[15.5rem] bg-card border-r border-border transform transition-transform duration-300 ease-out flex flex-col ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="px-5 py-4 border-b border-border flex-shrink-0">
          <h1 className="text-sm font-bold text-foreground font-display tracking-tight">Admin Panel</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">Krishna Tech Solutions</p>
        </div>

        <nav className="flex-1 px-3 py-3 overflow-y-auto">
          <div className="space-y-0.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                  activeTab === tab.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <tab.icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{tab.label}</span>
                {(tab as any).badge && (
                  <Badge variant="destructive" className="ml-auto text-[10px] h-5 min-w-[20px] px-1.5">{(tab as any).badge}</Badge>
                )}
              </button>
            ))}
          </div>
        </nav>

        <div className="px-3 py-3 border-t border-border flex-shrink-0">
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-destructive gap-2.5" onClick={handleSignOut}>
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/20 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />}

      <main className="md:ml-[15.5rem] min-h-screen">
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 md:px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground capitalize">
                {activeTab === "dashboard" ? "Dashboard" : tabs.find(t => t.id === activeTab)?.label || activeTab}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <AdminHeaderSearch onNavigate={(tab) => setActiveTab(tab as AdminTab)} />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative rounded-full">
                    <Bell className="w-4.5 h-4.5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">{unreadCount > 9 ? "9+" : unreadCount}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0">
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={markAllAsRead}>
                        <Check className="w-3 h-3" /> Mark all read
                      </Button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-border">
                    {notifications.length === 0 ? (
                      <p className="text-center py-6 text-sm text-muted-foreground">No notifications</p>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <div key={n.id} className={`px-4 py-3 ${!n.is_read ? "bg-primary/5" : ""}`}>
                          <p className="text-sm font-medium text-foreground">{n.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              <ThemeToggle />
            </div>
          </div>
        </div>
        <div className="p-4 md:p-6">{renderContent()}</div>
      </main>
    </div>
  );
};

export default AdminPanel;

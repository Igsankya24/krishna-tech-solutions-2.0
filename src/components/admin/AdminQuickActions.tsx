import { Calendar, Users, Briefcase, MessageSquare, FileText, Ticket, Newspaper, Star, DatabaseBackup, Settings, Wrench, Paintbrush } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface AdminQuickActionsProps {
  onNavigate: (tab: string) => void;
}

const QUICK_ACTIONS = [
  { label: "New Appointment", icon: Calendar, tab: "appointments", color: "bg-blue-500/10 text-blue-500" },
  { label: "Manage Users", icon: Users, tab: "users", color: "bg-green-500/10 text-green-500" },
  { label: "Edit Services", icon: Briefcase, tab: "services", color: "bg-purple-500/10 text-purple-500" },
  { label: "View Messages", icon: MessageSquare, tab: "messages", color: "bg-orange-500/10 text-orange-500" },
  { label: "Create Invoice", icon: FileText, tab: "invoices", color: "bg-pink-500/10 text-pink-500" },
  { label: "Manage Coupons", icon: Ticket, tab: "coupons", color: "bg-yellow-500/10 text-yellow-500" },
  { label: "Blog Posts", icon: Newspaper, tab: "blog", color: "bg-teal-500/10 text-teal-500" },
  { label: "Testimonials", icon: Star, tab: "testimonials", color: "bg-amber-500/10 text-amber-500" },
  { label: "Technicians", icon: Wrench, tab: "technicians", color: "bg-slate-500/10 text-slate-500" },
  { label: "Customization", icon: Paintbrush, tab: "customization", color: "bg-indigo-500/10 text-indigo-500" },
  { label: "Backup Data", icon: DatabaseBackup, tab: "backup-restore", color: "bg-red-500/10 text-red-500" },
  { label: "Settings", icon: Settings, tab: "settings", color: "bg-gray-500/10 text-gray-500" },
];

const AdminQuickActions = ({ onNavigate }: AdminQuickActionsProps) => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground font-display">Quick Actions</h2>
        <p className="text-muted-foreground text-sm mt-1">Jump to common tasks with one click.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {QUICK_ACTIONS.map((action) => (
          <Card key={action.tab} className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all" onClick={() => onNavigate(action.tab)}>
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${action.color}`}>
                <action.icon className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-foreground">{action.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminQuickActions;

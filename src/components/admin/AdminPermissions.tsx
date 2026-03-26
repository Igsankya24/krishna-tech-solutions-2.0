import { useState, useEffect } from "react";
import { supabase } from "@/services/database";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Shield, Save, Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AdminUser {
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: string;
}

interface Permissions {
  // Messages
  can_view_messages: boolean;
  // Appointments
  can_view_appointments: boolean;
  can_confirm_appointments: boolean;
  can_delete_appointments: boolean;
  // Users
  can_view_users: boolean;
  can_manage_users: boolean;
  // Services
  can_view_services: boolean;
  can_manage_services: boolean;
  // Service Projects
  can_view_service_projects: boolean;
  can_manage_service_projects: boolean;
  // Coupons
  can_view_coupons: boolean;
  can_manage_coupons: boolean;
  // Settings
  can_view_settings: boolean;
  can_manage_settings: boolean;
  // Invoices
  can_view_invoices: boolean;
  can_manage_invoices: boolean;
  // Technicians
  can_view_technicians: boolean;
  can_manage_technicians: boolean;
  // Analytics & Export
  can_view_analytics: boolean;
  can_view_traffic: boolean;
  can_export_data: boolean;
  // API Keys
  can_view_api_keys: boolean;
  can_manage_api_keys: boolean;
  // Bot Settings
  can_view_bot_settings: boolean;
  can_manage_bot_settings: boolean;
  // Deletion Requests
  can_view_deletion_requests: boolean;
  can_manage_deletion_requests: boolean;
  // Blog
  can_view_blog: boolean;
  can_manage_blog: boolean;
  can_view_blog_ads: boolean;
  can_manage_blog_ads: boolean;
  // Testimonials
  can_view_testimonials: boolean;
  can_manage_testimonials: boolean;
  // Team Members
  can_view_team_members: boolean;
  can_manage_team_members: boolean;
  // Customization
  can_view_customization: boolean;
  can_manage_customization: boolean;
  // Backup & Restore
  can_view_backup: boolean;
  can_manage_backup: boolean;
  // Payment Gateway
  can_view_payment: boolean;
  can_manage_payment: boolean;
  // CRM
  can_view_crm: boolean;
  can_manage_crm: boolean;
  // File Manager
  can_view_file_manager: boolean;
  can_manage_file_manager: boolean;
  // AI Insights
  can_view_ai_insights: boolean;
  // Tools
  can_use_smart_search: boolean;
  can_use_quick_actions: boolean;
  can_use_notes: boolean;
}

const defaultPermissions: Permissions = {
  can_view_messages: true,
  can_view_appointments: true,
  can_confirm_appointments: true,
  can_delete_appointments: false,
  can_view_users: true,
  can_manage_users: false,
  can_view_services: true,
  can_manage_services: false,
  can_view_service_projects: true,
  can_manage_service_projects: false,
  can_view_coupons: true,
  can_manage_coupons: false,
  can_view_settings: false,
  can_manage_settings: false,
  can_view_invoices: true,
  can_manage_invoices: false,
  can_view_technicians: true,
  can_manage_technicians: false,
  can_view_analytics: true,
  can_view_traffic: true,
  can_export_data: true,
  can_view_api_keys: false,
  can_manage_api_keys: false,
  can_view_bot_settings: true,
  can_manage_bot_settings: false,
  can_view_deletion_requests: true,
  can_manage_deletion_requests: false,
  can_view_blog: true,
  can_manage_blog: false,
  can_view_blog_ads: true,
  can_manage_blog_ads: false,
  can_view_testimonials: true,
  can_manage_testimonials: false,
  can_view_team_members: true,
  can_manage_team_members: false,
  can_view_customization: false,
  can_manage_customization: false,
  can_view_backup: false,
  can_manage_backup: false,
  can_view_payment: false,
  can_manage_payment: false,
  can_view_crm: false,
  can_manage_crm: false,
  can_view_file_manager: false,
  can_manage_file_manager: false,
  can_view_ai_insights: false,
  can_use_smart_search: true,
  can_use_quick_actions: true,
  can_use_notes: true,
};

const AdminPermissions = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<string>("");
  const [permissions, setPermissions] = useState<Permissions>(defaultPermissions);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => { fetchAdmins(); }, []);
  useEffect(() => { if (selectedAdmin) fetchPermissions(selectedAdmin); }, [selectedAdmin]);

  const fetchAdmins = async () => {
    setLoading(true);
    const { data: roles } = await supabase.from("user_roles").select("user_id, role").eq("role", "admin");
    if (!roles || roles.length === 0) { setAdmins([]); setLoading(false); return; }
    const userIds = roles.map(r => r.user_id);
    const { data: profiles } = await supabase.from("profiles").select("user_id, email, full_name").in("user_id", userIds);
    const adminUsers = roles.map(r => {
      const profile = profiles?.find(p => p.user_id === r.user_id);
      return { user_id: r.user_id, email: profile?.email || null, full_name: profile?.full_name || null, role: r.role };
    });
    setAdmins(adminUsers);
    if (adminUsers.length > 0 && !selectedAdmin) setSelectedAdmin(adminUsers[0].user_id);
    setLoading(false);
  };

  const fetchPermissions = async (userId: string) => {
    const { data } = await supabase.from("admin_permissions").select("*").eq("user_id", userId).maybeSingle();
    if (data) {
      const mapped: Permissions = {} as Permissions;
      for (const key of Object.keys(defaultPermissions) as (keyof Permissions)[]) {
        mapped[key] = (data as any)[key] ?? defaultPermissions[key];
      }
      setPermissions(mapped);
    } else {
      setPermissions(defaultPermissions);
    }
  };

  const savePermissions = async () => {
    if (!selectedAdmin) return;
    setSaving(true);
    const { error } = await supabase.from("admin_permissions").upsert({
      user_id: selectedAdmin, ...permissions, updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Permissions updated successfully" });
    }
    setSaving(false);
  };

  const PermissionRow = ({ label, permKey, description }: { label: string; permKey: keyof Permissions; description: string }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <div>
        <p className="font-medium text-foreground text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={permissions[permKey]} onCheckedChange={(checked) => setPermissions(prev => ({ ...prev, [permKey]: checked }))} />
    </div>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-4 pb-1 first:pt-0">{title}</h4>
  );

  if (loading) return <div className="flex items-center justify-center p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Admin Permissions</h2>
      </div>
      <p className="text-muted-foreground">
        Manage what each admin can access and do in the admin panel. Super admins always have full access.
      </p>

      {admins.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Admin Users</h3>
          <p className="text-muted-foreground">Promote a user to admin role first.</p>
        </div>
      ) : (
        <>
          <div className="bg-card rounded-xl border border-border p-6">
            <label className="block text-sm font-medium text-foreground mb-2">Select Admin</label>
            <Select value={selectedAdmin} onValueChange={setSelectedAdmin}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Select an admin" />
              </SelectTrigger>
              <SelectContent>
                {admins.map((admin) => (
                  <SelectItem key={admin.user_id} value={admin.user_id}>
                    {admin.full_name || admin.email || "Unknown"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedAdmin && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold text-lg mb-4">Permissions</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8">
                {/* Column 1 */}
                <div>
                  <SectionHeader title="Messages" />
                  <PermissionRow label="View Messages" permKey="can_view_messages" description="Can view contact messages" />

                  <SectionHeader title="Appointments" />
                  <PermissionRow label="View Appointments" permKey="can_view_appointments" description="Can view all appointments" />
                  <PermissionRow label="Confirm Appointments" permKey="can_confirm_appointments" description="Can confirm or update status" />
                  <PermissionRow label="Delete Appointments" permKey="can_delete_appointments" description="Can delete appointments directly" />

                  <SectionHeader title="Users" />
                  <PermissionRow label="View Users" permKey="can_view_users" description="Can view user list" />
                  <PermissionRow label="Manage Users" permKey="can_manage_users" description="Can edit, approve, freeze users" />

                  <SectionHeader title="Services" />
                  <PermissionRow label="View Services" permKey="can_view_services" description="Can view services" />
                  <PermissionRow label="Manage Services" permKey="can_manage_services" description="Can add, edit, delete services" />
                  <PermissionRow label="View Service Projects" permKey="can_view_service_projects" description="Can view service projects" />
                  <PermissionRow label="Manage Service Projects" permKey="can_manage_service_projects" description="Can add, edit, delete projects" />

                  <SectionHeader title="Coupons" />
                  <PermissionRow label="View Coupons" permKey="can_view_coupons" description="Can view coupons" />
                  <PermissionRow label="Manage Coupons" permKey="can_manage_coupons" description="Can add, edit, delete coupons" />

                  <SectionHeader title="Invoices" />
                  <PermissionRow label="View Invoices" permKey="can_view_invoices" description="Can view invoices" />
                  <PermissionRow label="Manage Invoices" permKey="can_manage_invoices" description="Can create, edit, delete invoices" />

                  <SectionHeader title="Technicians" />
                  <PermissionRow label="View Technicians" permKey="can_view_technicians" description="Can view technicians" />
                  <PermissionRow label="Manage Technicians" permKey="can_manage_technicians" description="Can add, edit, delete technicians" />

                  <SectionHeader title="Settings" />
                  <PermissionRow label="View Settings" permKey="can_view_settings" description="Can view site settings" />
                  <PermissionRow label="Manage Settings" permKey="can_manage_settings" description="Can modify site settings" />
                </div>

                {/* Column 2 */}
                <div>
                  <SectionHeader title="Blog" />
                  <PermissionRow label="View Blog Posts" permKey="can_view_blog" description="Can view blog posts" />
                  <PermissionRow label="Manage Blog Posts" permKey="can_manage_blog" description="Can add, edit, delete blog posts" />
                  <PermissionRow label="View Blog Ads" permKey="can_view_blog_ads" description="Can view blog ad placements" />
                  <PermissionRow label="Manage Blog Ads" permKey="can_manage_blog_ads" description="Can manage blog ads" />

                  <SectionHeader title="Testimonials" />
                  <PermissionRow label="View Testimonials" permKey="can_view_testimonials" description="Can view testimonials" />
                  <PermissionRow label="Manage Testimonials" permKey="can_manage_testimonials" description="Can add, edit, delete testimonials" />

                  <SectionHeader title="Team Members" />
                  <PermissionRow label="View Team Members" permKey="can_view_team_members" description="Can view team members" />
                  <PermissionRow label="Manage Team Members" permKey="can_manage_team_members" description="Can add, edit, delete team members" />

                  <SectionHeader title="Website Customization" />
                  <PermissionRow label="View Customization" permKey="can_view_customization" description="Can view website customization" />
                  <PermissionRow label="Manage Customization" permKey="can_manage_customization" description="Can modify website appearance" />

                  <SectionHeader title="Backup & Restore" />
                  <PermissionRow label="View Backups" permKey="can_view_backup" description="Can view backup history" />
                  <PermissionRow label="Manage Backups" permKey="can_manage_backup" description="Can create and restore backups" />

                  <SectionHeader title="Payment Gateway" />
                  <PermissionRow label="View Payment Settings" permKey="can_view_payment" description="Can view payment gateway settings" />
                  <PermissionRow label="Manage Payment Settings" permKey="can_manage_payment" description="Can configure payment gateways" />

                  <SectionHeader title="CRM" />
                  <PermissionRow label="View CRM" permKey="can_view_crm" description="Can view customer CRM data" />
                  <PermissionRow label="Manage CRM" permKey="can_manage_crm" description="Can manage CRM records" />

                  <SectionHeader title="File Manager" />
                  <PermissionRow label="View Files" permKey="can_view_file_manager" description="Can view uploaded files" />
                  <PermissionRow label="Manage Files" permKey="can_manage_file_manager" description="Can upload and delete files" />

                  <SectionHeader title="Analytics & Monitoring" />
                  <PermissionRow label="View Analytics" permKey="can_view_analytics" description="Can view analytics dashboard" />
                  <PermissionRow label="View Traffic" permKey="can_view_traffic" description="Can view traffic analytics" />
                  <PermissionRow label="View AI Insights" permKey="can_view_ai_insights" description="Can view AI-powered insights" />
                  <PermissionRow label="Export Data" permKey="can_export_data" description="Can export data" />

                  <SectionHeader title="API & Bot" />
                  <PermissionRow label="View API Keys" permKey="can_view_api_keys" description="Can view API keys" />
                  <PermissionRow label="Manage API Keys" permKey="can_manage_api_keys" description="Can manage API keys" />
                  <PermissionRow label="View Bot Settings" permKey="can_view_bot_settings" description="Can view chatbot settings" />
                  <PermissionRow label="Manage Bot Settings" permKey="can_manage_bot_settings" description="Can modify bot settings" />

                  <SectionHeader title="Deletion Requests" />
                  <PermissionRow label="View Deletion Requests" permKey="can_view_deletion_requests" description="Can view pending deletions" />
                  <PermissionRow label="Manage Deletion Requests" permKey="can_manage_deletion_requests" description="Can approve or reject deletions" />

                  <SectionHeader title="Tools" />
                  <PermissionRow label="Smart Search" permKey="can_use_smart_search" description="Can use global smart search" />
                  <PermissionRow label="Quick Actions" permKey="can_use_quick_actions" description="Can use quick actions panel" />
                  <PermissionRow label="Notes" permKey="can_use_notes" description="Can use admin notes" />
                </div>
              </div>

              <div className="pt-6">
                <Button onClick={savePermissions} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Saving..." : "Save Permissions"}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminPermissions;

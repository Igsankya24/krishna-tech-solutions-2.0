import { useState, useEffect } from "react";
import { Shield, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/services/database";

const PERMISSIONS = [
  "can_view_messages", "can_view_appointments", "can_confirm_appointments", "can_delete_appointments",
  "can_view_users", "can_manage_users", "can_view_services", "can_manage_services",
  "can_view_coupons", "can_manage_coupons", "can_view_settings", "can_manage_settings",
  "can_view_invoices", "can_manage_invoices", "can_view_technicians", "can_manage_technicians",
  "can_view_analytics", "can_export_data", "can_view_blog", "can_manage_blog",
];

const AdminRoleMatrix = () => {
  const [admins, setAdmins] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMatrix();
  }, []);

  const fetchMatrix = async () => {
    setIsLoading(true);
    try {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["admin", "super_admin"]);

      if (roles) {
        const adminData = await Promise.all(
          roles.map(async (r) => {
            const { data: profile } = await supabase.from("profiles").select("full_name, email").eq("user_id", r.user_id).maybeSingle();
            const { data: perms } = await supabase.from("admin_permissions").select("*").eq("user_id", r.user_id).maybeSingle();
            return { ...r, profile, permissions: perms };
          })
        );
        setAdmins(adminData);
      }
    } catch (error) {
      console.error("Error fetching matrix:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPermName = (name: string) => name.replace(/^can_/, "").replace(/_/g, " ");

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground font-display">Role Permission Matrix</h2>
        <p className="text-muted-foreground text-sm mt-1">Visual overview of all admin permissions across roles.</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" /></div>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="p-2 text-left font-medium text-muted-foreground sticky left-0 bg-muted/50 min-w-[150px]">Permission</th>
                  {admins.map((admin) => (
                    <th key={admin.user_id} className="p-2 text-center font-medium text-muted-foreground min-w-[100px]">
                      <div>{admin.profile?.full_name || "Unknown"}</div>
                      <div className="text-[10px] font-normal">{admin.role}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {PERMISSIONS.map((perm) => (
                  <tr key={perm} className="hover:bg-muted/30">
                    <td className="p-2 font-medium text-foreground capitalize sticky left-0 bg-card">{formatPermName(perm)}</td>
                    {admins.map((admin) => {
                      const hasPermission = admin.role === "super_admin" ? true : admin.permissions?.[perm] ?? false;
                      return (
                        <td key={admin.user_id} className="p-2 text-center">
                          {hasPermission ? (
                            <Check className="w-4 h-4 text-green-500 mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-red-400 mx-auto" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminRoleMatrix;

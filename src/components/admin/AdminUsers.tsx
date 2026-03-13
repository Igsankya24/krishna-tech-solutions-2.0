import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { UserCheck, UserX, Search, Edit, X, Save, Camera, Phone, MapPin, Mail, Lock, Unlock, Trash2, Key, Shield, LogIn, CalendarCheck, UserPlus, Eye, EyeOff, AtSign, ShieldCheck, Copy, QrCode } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { exportToExcel, exportToPDF, exportToWord } from "@/lib/exportUtils";
import { format, parseISO, isWithinInterval } from "date-fns";
import ExportDateRange from "./ExportDateRange";

interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
  is_approved: boolean;
  is_frozen: boolean;
  created_at: string;
  role?: string;
  login_count?: number;
  appointment_count?: number;
  username?: string | null;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [passwordChangeUser, setPasswordChangeUser] = useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [newUserIdentifier, setNewUserIdentifier] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserFullName, setNewUserFullName] = useState("");
  const [newUserRole, setNewUserRole] = useState("user");
  const [newUserApproved, setNewUserApproved] = useState(true);
  const [creatingUser, setCreatingUser] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [usernameChangeUser, setUsernameChangeUser] = useState<UserProfile | null>(null);
  const [newUsername, setNewUsername] = useState("");
  const [changingUsername, setChangingUsername] = useState(false);
  const [totpSetupUser, setTotpSetupUser] = useState<UserProfile | null>(null);
  const [totpSecret, setTotpSecret] = useState<string>("");
  const [totpUri, setTotpUri] = useState<string>("");
  const [settingUpTotp, setSettingUpTotp] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const { toast } = useToast();
  const { isSuperAdmin } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesError) {
      toast({ title: "Error", description: profilesError.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role");

    // Get session counts per user
    const { data: sessions } = await supabase
      .from("sessions")
      .select("user_id");

    // Get appointment counts per user
    const { data: appointments } = await supabase
      .from("appointments")
      .select("user_id");

    // Count sessions per user
    const sessionCounts: Record<string, number> = {};
    sessions?.forEach((s) => {
      if (s.user_id) {
        sessionCounts[s.user_id] = (sessionCounts[s.user_id] || 0) + 1;
      }
    });

    // Count appointments per user
    const appointmentCounts: Record<string, number> = {};
    appointments?.forEach((a) => {
      if (a.user_id) {
        appointmentCounts[a.user_id] = (appointmentCounts[a.user_id] || 0) + 1;
      }
    });

    const rolesMap: Record<string, string> = {};
    roles?.forEach((r) => {
      if (r.role === "super_admin" || (r.role === "admin" && !rolesMap[r.user_id])) {
        rolesMap[r.user_id] = r.role;
      } else if (!rolesMap[r.user_id]) {
        rolesMap[r.user_id] = r.role;
      }
    });

    const usersWithRoles = profiles?.map((p) => ({
      ...p,
      role: rolesMap[p.user_id] || "user",
      is_frozen: (p as any).is_frozen ?? false,
      login_count: sessionCounts[p.user_id] || 0,
      appointment_count: appointmentCounts[p.user_id] || 0,
    })) || [];

    setUsers(usersWithRoles);
    setLoading(false);
  };

  const toggleFreeze = async (userId: string, currentFrozen: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_frozen: !currentFrozen, updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ 
        title: "Success", 
        description: `User account ${currentFrozen ? "unfrozen" : "frozen"}` 
      });
      fetchUsers();
    }
  };

  const handleExport = (type: 'excel' | 'pdf' | 'word', fromDate: string | null, toDate: string | null) => {
    let dataToExport = filteredUsers;

    // Filter by date range if provided
    if (fromDate && toDate) {
      dataToExport = dataToExport.filter(u => {
        const createdDate = parseISO(u.created_at);
        return isWithinInterval(createdDate, {
          start: parseISO(fromDate),
          end: parseISO(toDate)
        });
      });
    }

    const exportData = dataToExport.map(u => ({
      Name: u.full_name || 'No name',
      Email: u.email || '-',
      Phone: u.phone || '-',
      Role: u.role || 'user',
      Logins: u.login_count || 0,
      Appointments: u.appointment_count || 0,
      Status: u.is_approved ? 'Approved' : 'Pending',
      Frozen: u.is_frozen ? 'Yes' : 'No',
      Created: format(new Date(u.created_at), "MMM d, yyyy")
    }));

    const dateRangeStr = fromDate && toDate 
      ? `_${fromDate}_to_${toDate}` 
      : '';
    const filename = `users${dateRangeStr}_${format(new Date(), 'yyyy-MM-dd')}`;
    
    switch (type) {
      case 'excel':
        exportToExcel(exportData, filename);
        break;
      case 'pdf':
        exportToPDF(exportData, filename, 'Users Report');
        break;
      case 'word':
        exportToWord(exportData, filename, 'Users Report');
        break;
    }
    
    toast({ title: "Success", description: `Exported ${exportData.length} records to ${type.toUpperCase()}` });
  };

  const toggleApproval = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_approved: !currentStatus, updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `User ${currentStatus ? "unapproved" : "approved"}` });
      fetchUsers();
    }
  };

  const updateRole = async (userId: string, newRole: string) => {
    await supabase.from("user_roles").delete().eq("user_id", userId);

    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: newRole });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Role updated successfully" });
      fetchUsers();
    }
  };

  const deleteUser = async (user: UserProfile) => {
    if (user.role === "super_admin") {
      toast({ title: "Error", description: "Super Admin accounts cannot be deleted", variant: "destructive" });
      return;
    }

    // Delete profile (this will cascade to related data)
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("user_id", user.user_id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "User deleted successfully" });
      fetchUsers();
    }
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const changeUserPassword = async () => {
    if (!passwordChangeUser) return;

    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setChangingPassword(true);

    try {
      const { data, error } = await supabase.functions.invoke('change-user-password', {
        body: { 
          targetUserId: passwordChangeUser.user_id, 
          newPassword: newPassword 
        }
      });

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else if (data?.error) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Password changed successfully" });
        setPasswordChangeUser(null);
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change password';
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }

    setChangingPassword(false);
  };

  // Detect if input is email or username
  const isEmail = (value: string) => value.includes("@");

  const createUser = async () => {
    if (!newUserIdentifier) {
      toast({ title: "Error", description: "Username or email is required", variant: "destructive" });
      return;
    }

    if (!newUserPassword) {
      toast({ title: "Error", description: "Password is required", variant: "destructive" });
      return;
    }

    if (newUserPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setCreatingUser(true);

    try {
      const identifier = newUserIdentifier.trim();
      const isEmailInput = isEmail(identifier);
      
      // Generate email - if username, create internal email
      const email = isEmailInput ? identifier : `${identifier.toLowerCase().replace(/[^a-z0-9]/g, '')}@krishnatech.internal`;
      const username = isEmailInput ? null : identifier;

      const { data, error } = await supabase.functions.invoke("create-user", {
        body: {
          email: email,
          password: newUserPassword,
          fullName: newUserFullName || (username || ""),
          role: newUserRole,
          isApproved: newUserApproved,
          username: username,
        },
      });

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else if (data?.error) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      } else {
        toast({ title: "Success", description: `User created successfully${username ? `. Username: ${username}` : ""}` });
        setCreateUserOpen(false);
        setNewUserIdentifier("");
        setNewUserPassword("");
        setNewUserFullName("");
        setNewUserRole("user");
        setNewUserApproved(true);
        fetchUsers();
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create user";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }

    setCreatingUser(false);
  };

  const changeUsername = async () => {
    if (!usernameChangeUser || !newUsername.trim()) return;

    setChangingUsername(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ username: newUsername.trim(), updated_at: new Date().toISOString() })
        .eq("user_id", usernameChangeUser.user_id);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Username updated successfully" });
        setUsernameChangeUser(null);
        setNewUsername("");
        fetchUsers();
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to change username";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }

    setChangingUsername(false);
  };

  const setupTotp = async (user: UserProfile) => {
    setTotpSetupUser(user);
    setSettingUpTotp(true);
    setTotpSecret("");
    setTotpUri("");

    try {
      const { data, error } = await supabase.functions.invoke("setup-totp", {
        body: { user_id: user.user_id },
      });

      if (error || data?.error) {
        toast({ title: "Error", description: data?.error || error?.message || "Failed to setup authenticator", variant: "destructive" });
        setTotpSetupUser(null);
      } else {
        setTotpSecret(data.secret);
        setTotpUri(data.otpauth_uri);
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to setup authenticator", variant: "destructive" });
      setTotpSetupUser(null);
    }
    setSettingUpTotp(false);
  };


  const handleEditSave = async () => {
    if (!editingUser) return;

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: editingUser.full_name,
        phone: editingUser.phone,
        address: editingUser.address,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", editingUser.user_id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "User updated successfully" });
      fetchUsers();
      setEditingUser(null);
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !editingUser) return;

    const file = e.target.files[0];
    const fileExt = file.name.split(".").pop();
    const fileName = `${editingUser.user_id}/${Date.now()}.${fileExt}`;

    setUploading(true);

    if (editingUser.avatar_url) {
      const oldPath = editingUser.avatar_url.split("/").slice(-2).join("/");
      await supabase.storage.from("avatars").remove([oldPath]);
    }

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Error", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("user_id", editingUser.user_id);

    if (updateError) {
      toast({ title: "Error", description: updateError.message, variant: "destructive" });
    } else {
      setEditingUser({ ...editingUser, avatar_url: publicUrl });
      toast({ title: "Success", description: "Avatar updated successfully" });
      fetchUsers();
    }
    setUploading(false);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-foreground">Users</h2>
        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <Button onClick={() => setCreateUserOpen(true)} className="gap-2">
              <UserPlus className="w-4 h-4" />
              Create User
            </Button>
          )}
          <ExportDateRange onExport={handleExport} />
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Role</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-t border-border hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => setSelectedUser(user)}
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.avatar_url || ""} />
                        <AvatarFallback className="text-xs">{user.full_name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{user.full_name || "No name"}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.username ? `@${user.username}` : user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 hidden sm:table-cell">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      user.role === "super_admin" ? "bg-primary/10 text-primary" :
                      user.role === "admin" ? "bg-accent/10 text-accent-foreground" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {user.role === "super_admin" ? "Super Admin" : user.role === "admin" ? "Admin" : "User"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 hidden md:table-cell">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${user.is_approved ? "bg-green-500" : "bg-yellow-500"}`} />
                      <span className="text-xs text-muted-foreground">{user.is_approved ? "Approved" : "Pending"}</span>
                      {user.is_frozen && (
                        <>
                          <span className="w-2 h-2 rounded-full bg-destructive" />
                          <span className="text-xs text-destructive">Frozen</span>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              {/* Avatar */}
              <div className="flex justify-center">
                <div className="relative">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={editingUser.avatar_url || ""} />
                    <AvatarFallback className="text-xl">
                      {editingUser.full_name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute bottom-0 right-0 w-7 h-7 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90">
                    <Camera className="w-3.5 h-3.5 text-primary-foreground" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email
                </label>
                <Input value={editingUser.email || ""} disabled className="bg-muted" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <Input
                  value={editingUser.full_name || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Phone
                </label>
                <Input
                  value={editingUser.phone || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Address
                </label>
                <Textarea
                  value={editingUser.address || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, address: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditingUser(null)} className="flex-1">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleEditSave} disabled={saving} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {userToDelete?.full_name || userToDelete?.email}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && deleteUser(userToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Password Dialog */}
      <Dialog open={!!passwordChangeUser} onOpenChange={() => {
        setPasswordChangeUser(null);
        setNewPassword("");
        setConfirmPassword("");
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          {passwordChangeUser && (
            <div className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">{passwordChangeUser.full_name || 'User'}</p>
                <p className="text-xs text-muted-foreground">{passwordChangeUser.email}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">New Password</label>
                <Input
                  type="password"
                  placeholder="Enter new password (min 6 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm Password</label>
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-sm text-destructive">Passwords do not match</p>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setPasswordChangeUser(null);
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={changeUserPassword}
                  disabled={changingPassword || !newPassword || newPassword !== confirmPassword || newPassword.length < 6}
                >
                  {changingPassword ? "Changing..." : "Change Password"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create User Dialog - Super Admin Only */}
      <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Create New User
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Full Name</label>
              <Input
                value={newUserFullName}
                onChange={(e) => setNewUserFullName(e.target.value)}
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Username or Email *</label>
              <Input
                type="text"
                value={newUserIdentifier}
                onChange={(e) => setNewUserIdentifier(e.target.value)}
                placeholder="username or user@example.com"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter username (without @) or full email address
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Password *</label>
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Role</label>
              <Select value={newUserRole} onValueChange={setNewUserRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="newUserApproved"
                checked={newUserApproved}
                onChange={(e) => setNewUserApproved(e.target.checked)}
                className="rounded border-border"
              />
              <label htmlFor="newUserApproved" className="text-sm text-muted-foreground">
                Approve user immediately
              </label>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCreateUserOpen(false);
                  setNewUserIdentifier("");
                  setNewUserPassword("");
                  setNewUserFullName("");
                  setNewUserRole("user");
                  setNewUserApproved(true);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={createUser}
                disabled={creatingUser || !newUserIdentifier || !newUserPassword || newUserPassword.length < 6}
              >
                {creatingUser ? "Creating..." : "Create User"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Username Dialog */}
      <Dialog open={!!usernameChangeUser} onOpenChange={() => {
        setUsernameChangeUser(null);
        setNewUsername("");
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Username</DialogTitle>
          </DialogHeader>
          {usernameChangeUser && (
            <div className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">{usernameChangeUser.full_name || 'User'}</p>
                <p className="text-xs text-muted-foreground">{usernameChangeUser.email}</p>
                {usernameChangeUser.username && (
                  <p className="text-xs text-muted-foreground">Current username: {usernameChangeUser.username}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">New Username</label>
                <Input
                  type="text"
                  placeholder="Enter new username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setUsernameChangeUser(null);
                    setNewUsername("");
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={changeUsername}
                  disabled={changingUsername || !newUsername.trim()}
                >
                  {changingUsername ? "Changing..." : "Change Username"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* TOTP Setup Dialog */}
      <Dialog open={!!totpSetupUser} onOpenChange={() => {
        setTotpSetupUser(null);
        setTotpSecret("");
        setTotpUri("");
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Google Authenticator Setup
            </DialogTitle>
          </DialogHeader>
          {totpSetupUser && (
            <div className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">{totpSetupUser.full_name || "User"}</p>
                <p className="text-xs text-muted-foreground">{totpSetupUser.email || totpSetupUser.username}</p>
              </div>

              {settingUpTotp ? (
                <p className="text-center text-muted-foreground py-4">Generating authenticator secret...</p>
              ) : totpSecret ? (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg text-center space-y-3">
                    <p className="text-sm font-medium text-foreground">
                      Scan this QR code in Google Authenticator:
                    </p>
                    <div className="flex justify-center">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(totpUri)}`}
                        alt="TOTP QR Code"
                        className="w-48 h-48 rounded-lg border border-border"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Or enter this key manually:
                    </p>
                    <div className="flex items-center gap-2 justify-center">
                      <code className="text-sm font-mono bg-background px-3 py-1.5 rounded border border-border break-all">
                        {totpSecret}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(totpSecret);
                          toast({ title: "Copied!", description: "Secret key copied to clipboard" });
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    ⚠️ Share this QR code / key with the user securely. They will need it to log in.
                  </p>
                </div>
              ) : null}

              <div className="flex justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setTotpSetupUser(null);
                    setTotpSecret("");
                    setTotpUri("");
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;

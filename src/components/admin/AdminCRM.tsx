import { useState, useEffect } from "react";
import { Users, Mail, Phone, Calendar, Search, Filter, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/services/database";

interface Customer {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string | null;
  is_approved: boolean | null;
  appointment_count: number;
  last_appointment: string | null;
}

const AdminCRM = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, phone, created_at, is_approved")
        .order("created_at", { ascending: false });

      if (profiles) {
        // Get appointment counts for each user
        const customerData = await Promise.all(
          profiles.map(async (profile) => {
            const { count } = await supabase
              .from("appointments")
              .select("id", { count: "exact", head: true })
              .eq("user_id", profile.user_id);

            const { data: lastApt } = await supabase
              .from("appointments")
              .select("appointment_date")
              .eq("user_id", profile.user_id)
              .order("appointment_date", { ascending: false })
              .limit(1);

            return {
              ...profile,
              appointment_count: count || 0,
              last_appointment: lastApt?.[0]?.appointment_date || null,
            };
          })
        );
        setCustomers(customerData);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = customers.filter(c =>
    !searchQuery || 
    c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-display">Customer CRM</h2>
          <p className="text-muted-foreground text-sm mt-1">Manage customer relationships and track engagement.</p>
        </div>
        <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> Export</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{customers.length}</p>
          <p className="text-xs text-muted-foreground">Total Customers</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{customers.filter(c => c.is_approved).length}</p>
          <p className="text-xs text-muted-foreground">Approved</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{customers.filter(c => c.appointment_count > 0).length}</p>
          <p className="text-xs text-muted-foreground">With Bookings</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{customers.filter(c => c.appointment_count > 2).length}</p>
          <p className="text-xs text-muted-foreground">Repeat Customers</p>
        </CardContent></Card>
      </div>

      <Input placeholder="Search customers..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="max-w-sm" />

      {isLoading ? (
        <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" /></div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Customer</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Contact</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Bookings</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Last Visit</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((customer) => (
                    <tr key={customer.user_id} className="hover:bg-muted/30">
                      <td className="p-3">
                        <p className="font-medium text-foreground">{customer.full_name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{customer.email}</p>
                      </td>
                      <td className="p-3 text-muted-foreground">{customer.phone || "—"}</td>
                      <td className="p-3"><Badge variant="secondary">{customer.appointment_count}</Badge></td>
                      <td className="p-3 text-muted-foreground text-xs">{customer.last_appointment ? new Date(customer.last_appointment).toLocaleDateString() : "Never"}</td>
                      <td className="p-3">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${customer.is_approved ? "bg-green-500/15 text-green-600 dark:text-green-400" : "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400"}`}>
                          {customer.is_approved ? "Approved" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminCRM;

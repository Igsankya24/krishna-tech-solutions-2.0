import { useState } from "react";
import { Search, X, Users, Calendar, Briefcase, MessageSquare, FileText, Ticket } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/services/database";

interface SearchResult {
  type: "user" | "appointment" | "service" | "message" | "invoice" | "coupon";
  id: string;
  title: string;
  subtitle: string;
}

const typeIcons = {
  user: Users,
  appointment: Calendar,
  service: Briefcase,
  message: MessageSquare,
  invoice: FileText,
  coupon: Ticket,
};

const typeLabels = {
  user: "User",
  appointment: "Appointment",
  service: "Service",
  message: "Message",
  invoice: "Invoice",
  coupon: "Coupon",
};

interface AdminSmartSearchProps {
  onNavigate: (tab: string) => void;
}

const AdminSmartSearch = ({ onNavigate }: AdminSmartSearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const [users, services, appointments, messages, invoices, coupons] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, email").or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`).limit(5),
        supabase.from("services").select("id, name, description").ilike("name", `%${searchQuery}%`).limit(5),
        supabase.from("appointments").select("id, reference_id, appointment_date, status").or(`reference_id.ilike.%${searchQuery}%,status.ilike.%${searchQuery}%`).limit(5),
        supabase.from("contact_messages").select("id, name, subject, email").or(`name.ilike.%${searchQuery}%,subject.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`).limit(5),
        supabase.from("invoices").select("id, invoice_number, customer_name").or(`invoice_number.ilike.%${searchQuery}%,customer_name.ilike.%${searchQuery}%`).limit(5),
        supabase.from("coupons").select("id, code, discount_percent").ilike("code", `%${searchQuery}%`).limit(5),
      ]);

      const allResults: SearchResult[] = [
        ...(users.data?.map(u => ({ type: "user" as const, id: u.user_id, title: u.full_name || "Unknown", subtitle: u.email || "" })) || []),
        ...(services.data?.map(s => ({ type: "service" as const, id: s.id, title: s.name, subtitle: s.description || "" })) || []),
        ...(appointments.data?.map(a => ({ type: "appointment" as const, id: a.id, title: a.reference_id || a.id, subtitle: `${a.appointment_date} · ${a.status}` })) || []),
        ...(messages.data?.map(m => ({ type: "message" as const, id: m.id, title: m.name, subtitle: m.subject || m.email })) || []),
        ...(invoices.data?.map(i => ({ type: "invoice" as const, id: i.id, title: i.invoice_number, subtitle: i.customer_name })) || []),
        ...(coupons.data?.map(c => ({ type: "coupon" as const, id: c.id, title: c.code, subtitle: `${c.discount_percent}% off` })) || []),
      ];

      setResults(allResults);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    const tabMap: Record<string, string> = {
      user: "users",
      appointment: "appointments",
      service: "services",
      message: "messages",
      invoice: "invoices",
      coupon: "coupons",
    };
    onNavigate(tabMap[result.type] || "dashboard");
    setQuery("");
    setResults([]);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground font-display">Global Smart Search</h2>
        <p className="text-muted-foreground text-sm mt-1">Search across users, services, appointments, messages, invoices, and more.</p>
      </div>

      <div className="relative max-w-2xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search anything... (users, appointments, services, invoices)"
          className="pl-10 pr-10 h-12 text-base"
        />
        {query && (
          <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => { setQuery(""); setResults([]); }}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {isSearching && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
          Searching...
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2 max-w-2xl">
          <p className="text-sm text-muted-foreground">{results.length} results found</p>
          {results.map((result) => {
            const Icon = typeIcons[result.type];
            return (
              <Card key={`${result.type}-${result.id}`} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => handleResultClick(result)}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{result.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                  </div>
                  <span className="text-[10px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{typeLabels[result.type]}</span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {query.length >= 2 && results.length === 0 && !isSearching && (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No results found for "{query}"</p>
          <p className="text-xs mt-1">Try a different search term</p>
        </div>
      )}

      {!query && (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Start typing to search across all data</p>
          <p className="text-xs mt-1">Search users, appointments, services, invoices, coupons, and messages</p>
        </div>
      )}
    </div>
  );
};

export default AdminSmartSearch;

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, ArrowRight, Users, Briefcase, Calendar, MessageSquare, Ticket, Newspaper, Star, UserCheck, Settings, Paintbrush, Shield, Key, CreditCard, BarChart3, Globe, Bot, FileText, Wrench, FolderOpen, Megaphone, Trash2, UserCog, Lock, History, Activity, Heart, Zap, StickyNote, ToggleLeft, Clock, Download, Upload, BarChart, Brain, Sparkles, Cog, Languages, ShieldCheck, FileBarChart, MessageCircle, DatabaseBackup, FolderOpenDot, UserCircle, LayoutDashboard, Move, Command, Radio, BrainCircuit, BellRing, Gauge, Beaker } from "lucide-react";
import { supabase } from "@/services/database";

type AdminTab = string;

interface SearchItem {
  id: string;
  label: string;
  description: string;
  icon: any;
  type: "section" | "user" | "service" | "appointment" | "message";
  tab?: AdminTab;
  meta?: string;
}

const SECTION_ITEMS: Omit<SearchItem, "id">[] = [
  { label: "Dashboard", description: "Overview & statistics", icon: LayoutDashboard, type: "section", tab: "dashboard" },
  { label: "Services", description: "Manage services", icon: Briefcase, type: "section", tab: "services" },
  { label: "Service Projects", description: "Manage service projects", icon: FolderOpen, type: "section", tab: "service-projects" },
  { label: "Appointments", description: "View & manage appointments", icon: Calendar, type: "section", tab: "appointments" },
  { label: "Invoices", description: "Billing & invoices", icon: FileText, type: "section", tab: "invoices" },
  { label: "Technicians", description: "Manage technicians", icon: Wrench, type: "section", tab: "technicians" },
  { label: "Messages", description: "Contact messages", icon: MessageSquare, type: "section", tab: "messages" },
  { label: "Users", description: "User management", icon: Users, type: "section", tab: "users" },
  { label: "Coupons", description: "Discount coupons", icon: Ticket, type: "section", tab: "coupons" },
  { label: "Blog Posts", description: "Manage blog articles", icon: Newspaper, type: "section", tab: "blog" },
  { label: "Blog Ads", description: "Ad management", icon: Megaphone, type: "section", tab: "blog-ads" },
  { label: "Testimonials", description: "Customer reviews", icon: Star, type: "section", tab: "testimonials" },
  { label: "Team Members", description: "Team management", icon: UserCheck, type: "section", tab: "team-members" },
  { label: "Bot Settings", description: "Chatbot configuration", icon: Bot, type: "section", tab: "bot" },
  { label: "Website Customization", description: "Branding & appearance", icon: Paintbrush, type: "section", tab: "customization" },
  { label: "User Roles", description: "Role assignments", icon: UserCog, type: "section", tab: "user-permissions" },
  { label: "Admin Permissions", description: "Permission settings", icon: Shield, type: "section", tab: "permissions" },
  { label: "API Keys", description: "API key management", icon: Key, type: "section", tab: "api-keys" },
  { label: "Backup & Restore", description: "Data backups", icon: DatabaseBackup, type: "section", tab: "backup-restore" },
  { label: "Payment Gateway", description: "Payment settings", icon: CreditCard, type: "section", tab: "payment-gateway" },
  { label: "Deletion Requests", description: "Pending deletions", icon: Trash2, type: "section", tab: "deletion-requests" },
  { label: "My Profile", description: "Account settings", icon: UserCircle, type: "section", tab: "profile" },
  { label: "Settings", description: "System settings", icon: Settings, type: "section", tab: "settings" },
  { label: "Analytics", description: "Platform analytics", icon: BarChart3, type: "section", tab: "analytics" },
  { label: "Traffic Analytics", description: "Website traffic", icon: Globe, type: "section", tab: "traffic" },
  { label: "AI Insights", description: "AI-powered analytics", icon: Brain, type: "section", tab: "ai-insights" },
  { label: "System Health", description: "Server monitoring", icon: Activity, type: "section", tab: "system-health" },
  { label: "Customer CRM", description: "Customer relationships", icon: Heart, type: "section", tab: "crm" },
  { label: "File Manager", description: "File management", icon: FolderOpenDot, type: "section", tab: "file-manager" },
  { label: "Feature Flags", description: "Toggle features", icon: ToggleLeft, type: "section", tab: "feature-flags" },
  { label: "Automation Rules", description: "Workflow automation", icon: Zap, type: "section", tab: "automation" },
  { label: "Audit Logs", description: "Activity history", icon: History, type: "section", tab: "audit-logs" },
  { label: "User Access", description: "User permissions", icon: Lock, type: "section", tab: "user-access" },
  { label: "Permission Matrix", description: "Role permissions", icon: ShieldCheck, type: "section", tab: "role-matrix" },
  { label: "Security Dashboard", description: "Security overview", icon: ShieldCheck, type: "section", tab: "security-dashboard" },
  { label: "Data Export", description: "Export data", icon: Download, type: "section", tab: "data-export" },
  { label: "Data Import", description: "Import data", icon: Upload, type: "section", tab: "data-import" },
  { label: "Reports Generator", description: "Create reports", icon: FileBarChart, type: "section", tab: "reports" },
  { label: "Quick Actions", description: "Fast shortcuts", icon: Sparkles, type: "section", tab: "quick-actions" },
  { label: "Admin Notes", description: "Personal notes", icon: StickyNote, type: "section", tab: "admin-notes" },
  { label: "Smart Search", description: "Global search", icon: Search, type: "section", tab: "smart-search" },
  { label: "System Settings", description: "Global config", icon: Cog, type: "section", tab: "system-settings" },
  { label: "Multi-Language", description: "Translations", icon: Languages, type: "section", tab: "multi-language" },
  { label: "Scheduled Jobs", description: "Cron jobs", icon: Clock, type: "section", tab: "scheduled-jobs" },
  { label: "API Usage", description: "API statistics", icon: BarChart, type: "section", tab: "api-usage" },
  { label: "Customer Feedback", description: "User feedback", icon: MessageCircle, type: "section", tab: "feedback" },
  { label: "Backup Integrity", description: "Check backups", icon: DatabaseBackup, type: "section", tab: "backup-checker" },
];

interface AdminHeaderSearchProps {
  onNavigate: (tab: AdminTab) => void;
}

const AdminHeaderSearch = ({ onNavigate }: AdminHeaderSearchProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dbResults, setDbResults] = useState<SearchItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Keyboard shortcut: Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Search database for users, services, etc.
  const searchDatabase = useCallback(async (q: string) => {
    if (q.length < 2) {
      setDbResults([]);
      return;
    }

    const items: SearchItem[] = [];

    // Search profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, email")
      .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(5);

    if (profiles) {
      profiles.forEach((p) => {
        items.push({
          id: `user-${p.user_id}`,
          label: p.full_name || p.email || "Unknown",
          description: p.email || "",
          icon: Users,
          type: "user",
          tab: "users",
          meta: "User",
        });
      });
    }

    // Search services
    const { data: services } = await supabase
      .from("services")
      .select("id, name, description")
      .ilike("name", `%${q}%`)
      .limit(5);

    if (services) {
      services.forEach((s) => {
        items.push({
          id: `service-${s.id}`,
          label: s.name,
          description: s.description || "",
          icon: Briefcase,
          type: "service",
          tab: "services",
          meta: "Service",
        });
      });
    }

    // Search messages
    const { data: messages } = await supabase
      .from("contact_messages")
      .select("id, name, subject")
      .or(`name.ilike.%${q}%,subject.ilike.%${q}%`)
      .limit(3);

    if (messages) {
      messages.forEach((m) => {
        items.push({
          id: `msg-${m.id}`,
          label: m.name,
          description: m.subject || "No subject",
          icon: MessageSquare,
          type: "message",
          tab: "messages",
          meta: "Message",
        });
      });
    }

    setDbResults(items);
  }, []);

  // Filter and combine results
  useEffect(() => {
    const q = query.toLowerCase().trim();

    if (!q) {
      setResults(SECTION_ITEMS.slice(0, 6).map((item, i) => ({ ...item, id: `section-${i}` })));
      setSelectedIndex(0);
      return;
    }

    // Filter sections
    const sectionResults = SECTION_ITEMS
      .filter((item) => 
        item.label.toLowerCase().includes(q) || 
        item.description.toLowerCase().includes(q)
      )
      .map((item, i) => ({ ...item, id: `section-${i}` }));

    // Combine with db results
    const combined = [...sectionResults.slice(0, 5), ...dbResults.slice(0, 5)];
    setResults(combined);
    setSelectedIndex(0);
  }, [query, dbResults]);

  // Debounced DB search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchDatabase(query.trim());
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, searchDatabase]);

  const handleSelect = (item: SearchItem) => {
    if (item.tab) {
      onNavigate(item.tab);
    }
    setIsOpen(false);
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "user": return "bg-primary/10 text-primary";
      case "service": return "bg-accent/10 text-accent";
      case "message": return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Search Trigger */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground group relative"
        title="Search (Ctrl+K)"
      >
        <Search className="w-5 h-5" />
      </button>

      {/* Search Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-[380px] bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search sections, users, services..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted rounded border border-border">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[360px] overflow-y-auto py-2">
            {results.length > 0 ? (
              <>
                {/* Section header for sections */}
                {results.some(r => r.type === "section") && (
                  <p className="px-4 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {query ? "Sections" : "Quick Access"}
                  </p>
                )}
                {results.filter(r => r.type === "section").map((item, index) => {
                  const globalIndex = results.indexOf(item);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        selectedIndex === globalIndex ? "bg-primary/10" : "hover:bg-muted/50"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        selectedIndex === globalIndex ? "bg-primary/20" : "bg-muted"
                      }`}>
                        <item.icon className={`w-4 h-4 ${selectedIndex === globalIndex ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.label}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{item.description}</p>
                      </div>
                      <ArrowRight className={`w-3.5 h-3.5 flex-shrink-0 transition-opacity ${
                        selectedIndex === globalIndex ? "opacity-100 text-primary" : "opacity-0"
                      }`} />
                    </button>
                  );
                })}

                {/* DB results section */}
                {results.some(r => r.type !== "section") && (
                  <p className="px-4 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-1 border-t border-border pt-2">
                    Data Results
                  </p>
                )}
                {results.filter(r => r.type !== "section").map((item) => {
                  const globalIndex = results.indexOf(item);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        selectedIndex === globalIndex ? "bg-primary/10" : "hover:bg-muted/50"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        selectedIndex === globalIndex ? "bg-primary/20" : "bg-muted"
                      }`}>
                        <item.icon className={`w-4 h-4 ${selectedIndex === globalIndex ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.label}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{item.description}</p>
                      </div>
                      {item.meta && (
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${getTypeColor(item.type)}`}>
                          {item.meta}
                        </span>
                      )}
                    </button>
                  );
                })}
              </>
            ) : (
              <div className="px-4 py-8 text-center">
                <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No results for "{query}"</p>
                <p className="text-[11px] text-muted-foreground/60 mt-1">Try searching for a section or user name</p>
              </div>
            )}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2 border-t border-border bg-muted/30 flex items-center gap-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-muted rounded border border-border font-mono">↑↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-muted rounded border border-border font-mono">↵</kbd> Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-muted rounded border border-border font-mono">Ctrl+K</kbd> Open
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHeaderSearch;

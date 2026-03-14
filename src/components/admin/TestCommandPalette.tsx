import { useState, useEffect, useCallback } from "react";
import { Search, ArrowRight, Command, LayoutDashboard, Users, Calendar, Settings, Briefcase, FileText, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

interface TestCommandPaletteProps {
  onNavigate?: (tab: string) => void;
}

const commands = [
  { id: "dashboard", label: "Go to Dashboard", icon: LayoutDashboard, group: "Navigation", keywords: "home overview" },
  { id: "users", label: "Manage Users", icon: Users, group: "Navigation", keywords: "people accounts" },
  { id: "appointments", label: "View Appointments", icon: Calendar, group: "Navigation", keywords: "bookings schedule" },
  { id: "services", label: "Manage Services", icon: Briefcase, group: "Navigation", keywords: "products offerings" },
  { id: "invoices", label: "View Invoices", icon: FileText, group: "Navigation", keywords: "billing payments" },
  { id: "messages", label: "Check Messages", icon: MessageSquare, group: "Navigation", keywords: "inbox chat" },
  { id: "settings", label: "Open Settings", icon: Settings, group: "Navigation", keywords: "config preferences" },
];

const recentCommands = [
  { action: "Navigated to Users", time: "2 min ago" },
  { action: "Opened Settings", time: "5 min ago" },
  { action: "Viewed Appointments", time: "12 min ago" },
];

const TestCommandPalette = ({ onNavigate }: TestCommandPaletteProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setOpen((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleSelect = (commandId: string) => {
    setOpen(false);
    onNavigate?.(commandId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground font-display">Command Palette</h2>
        <p className="text-muted-foreground mt-1">Quick navigation with keyboard shortcuts</p>
      </div>

      {/* Activation Card */}
      <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Command className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Press Ctrl + K to open</h3>
          <p className="text-sm text-muted-foreground mb-4">Or click the button below to activate the command palette</p>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            <Search className="w-4 h-4" />
            Open Command Palette
            <Badge variant="secondary" className="ml-2 text-[10px]">⌘K</Badge>
          </button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Available Commands */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Available Commands</CardTitle>
            <CardDescription>Quick actions accessible via the palette</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {commands.map((cmd) => (
              <button
                key={cmd.id}
                onClick={() => handleSelect(cmd.id)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <cmd.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground flex-1">{cmd.label}</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Recent Commands */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Commands</CardTitle>
            <CardDescription>Your recent palette activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentCommands.map((cmd, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-foreground">{cmd.action}</span>
                <span className="text-xs text-muted-foreground">{cmd.time}</span>
              </div>
            ))}

            <div className="mt-4 p-4 rounded-lg bg-accent/10 border border-accent/20">
              <p className="text-xs font-medium text-accent-foreground">💡 Pro Tip</p>
              <p className="text-xs text-muted-foreground mt-1">
                Use the command palette to quickly jump between sections without using the sidebar.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Command Dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            {commands.filter(c => c.group === "Navigation").map((cmd) => (
              <CommandItem key={cmd.id} onSelect={() => handleSelect(cmd.id)}>
                <cmd.icon className="mr-2 h-4 w-4" />
                <span>{cmd.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
};

export default TestCommandPalette;

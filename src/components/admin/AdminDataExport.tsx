import { useState } from "react";
import { Download, FileSpreadsheet, FileText, File } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/services/database";
import { useToast } from "@/hooks/use-toast";
import { exportToExcel, exportToPDF, exportToWord } from "@/lib/exportUtils";

const TABLES = [
  { id: "profiles", label: "Users / Profiles" },
  { id: "appointments", label: "Appointments" },
  { id: "services", label: "Services" },
  { id: "contact_messages", label: "Contact Messages" },
  { id: "coupons", label: "Coupons" },
  { id: "invoices", label: "Invoices" },
  { id: "technicians", label: "Technicians" },
  { id: "blog_posts", label: "Blog Posts" },
  { id: "testimonials", label: "Testimonials" },
  { id: "team_members", label: "Team Members" },
];

const AdminDataExport = () => {
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [format, setFormat] = useState("json");
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const toggleTable = (id: string) => {
    setSelectedTables(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const handleExport = async () => {
    if (selectedTables.length === 0) {
      toast({ title: "Select tables", description: "Please select at least one table to export.", variant: "destructive" });
      return;
    }

    setIsExporting(true);
    try {
      const allData: Record<string, any[]> = {};

      for (const table of selectedTables) {
        const { data } = await supabase.from(table as any).select("*");
        allData[table] = data || [];
      }

      if (format === "json") {
        const blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === "excel") {
        for (const [table, data] of Object.entries(allData)) {
          if (data.length > 0) {
            const columns = Object.keys(data[0]);
            exportToExcel(data, columns, `${table}-export`);
          }
        }
      } else if (format === "pdf") {
        for (const [table, data] of Object.entries(allData)) {
          if (data.length > 0) {
            const columns = Object.keys(data[0]);
            exportToPDF(data, columns, `${table}-export`);
          }
        }
      }

      toast({ title: "Export complete", description: `Exported ${selectedTables.length} table(s) as ${format.toUpperCase()}` });
    } catch (error) {
      console.error("Export error:", error);
      toast({ title: "Export failed", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground font-display">Data Export Tools</h2>
        <p className="text-muted-foreground text-sm mt-1">Export your data in multiple formats.</p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div>
            <p className="text-sm font-medium text-foreground mb-3">Select tables to export:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {TABLES.map(table => (
                <label key={table.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                  <Checkbox checked={selectedTables.includes(table.id)} onCheckedChange={() => toggleTable(table.id)} />
                  <span className="text-sm text-foreground">{table.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExport} disabled={isExporting || selectedTables.length === 0}>
              <Download className="w-4 h-4 mr-1" /> {isExporting ? "Exporting..." : "Export Data"}
            </Button>
            <Button variant="outline" onClick={() => setSelectedTables(TABLES.map(t => t.id))}>Select All</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDataExport;

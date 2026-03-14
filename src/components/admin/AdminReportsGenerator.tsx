import { useState } from "react";
import { FileBarChart, Download, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/services/database";
import { useToast } from "@/hooks/use-toast";
import { exportToExcel, exportToPDF } from "@/lib/exportUtils";

const REPORT_TYPES = [
  { id: "appointments-summary", label: "Appointments Summary" },
  { id: "revenue-report", label: "Revenue Report" },
  { id: "user-growth", label: "User Growth Report" },
  { id: "service-popularity", label: "Service Popularity" },
  { id: "message-analytics", label: "Message Analytics" },
];

const AdminReportsGenerator = () => {
  const [reportType, setReportType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [format, setFormat] = useState("excel");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateReport = async () => {
    if (!reportType) {
      toast({ title: "Select a report type", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      let data: any[] = [];
      let columns: string[] = [];

      switch (reportType) {
        case "appointments-summary": {
          let query = supabase.from("appointments").select("id, reference_id, appointment_date, appointment_time, status, created_at");
          if (dateFrom) query = query.gte("appointment_date", dateFrom);
          if (dateTo) query = query.lte("appointment_date", dateTo);
          const { data: d } = await query.order("appointment_date", { ascending: false });
          data = d || [];
          columns = ["reference_id", "appointment_date", "appointment_time", "status", "created_at"];
          break;
        }
        case "revenue-report": {
          let query = supabase.from("invoices").select("invoice_number, customer_name, subtotal, tax_amount, discount, total, status, created_at");
          if (dateFrom) query = query.gte("created_at", dateFrom);
          if (dateTo) query = query.lte("created_at", dateTo);
          const { data: d } = await query.order("created_at", { ascending: false });
          data = d || [];
          columns = ["invoice_number", "customer_name", "subtotal", "tax_amount", "discount", "total", "status", "created_at"];
          break;
        }
        case "user-growth": {
          const { data: d } = await supabase.from("profiles").select("full_name, email, is_approved, created_at").order("created_at", { ascending: false });
          data = d || [];
          columns = ["full_name", "email", "is_approved", "created_at"];
          break;
        }
        case "service-popularity": {
          const { data: d } = await supabase.from("services").select("name, price, is_active, is_visible, display_order");
          data = d || [];
          columns = ["name", "price", "is_active", "is_visible", "display_order"];
          break;
        }
        case "message-analytics": {
          const { data: d } = await supabase.from("contact_messages").select("name, email, subject, is_read, source, created_at").order("created_at", { ascending: false });
          data = d || [];
          columns = ["name", "email", "subject", "is_read", "source", "created_at"];
          break;
        }
      }

      if (data.length === 0) {
        toast({ title: "No data", description: "No records found for this report.", variant: "destructive" });
        setIsGenerating(false);
        return;
      }

      const reportName = REPORT_TYPES.find(r => r.id === reportType)?.label || "report";
      if (format === "excel") {
        exportToExcel(data, columns, reportName);
      } else {
        exportToPDF(data, columns, reportName);
      }

      toast({ title: "Report generated", description: `${reportName} with ${data.length} records` });
    } catch (error) {
      console.error("Report error:", error);
      toast({ title: "Error generating report", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground font-display">Advanced Reports Generator</h2>
        <p className="text-muted-foreground text-sm mt-1">Generate custom reports with date filters and multiple formats.</p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger><SelectValue placeholder="Select report..." /></SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map(r => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Format</label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">From Date</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">To Date</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>

          <Button onClick={generateReport} disabled={isGenerating || !reportType}>
            <Download className="w-4 h-4 mr-1" /> {isGenerating ? "Generating..." : "Generate Report"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReportsGenerator;

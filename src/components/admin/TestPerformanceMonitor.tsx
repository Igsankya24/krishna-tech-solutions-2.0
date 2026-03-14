import { useState, useEffect } from "react";
import { Gauge, Cpu, HardDrive, Wifi, Database, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";

const responseTimeData = Array.from({ length: 20 }, (_, i) => ({
  time: `${i + 1}s`,
  api: Math.floor(Math.random() * 150) + 30,
  db: Math.floor(Math.random() * 80) + 10,
  render: Math.floor(Math.random() * 100) + 20,
}));

const endpointData = [
  { name: "/api/appointments", avgMs: 45, calls: 1250, status: "healthy" },
  { name: "/api/users", avgMs: 32, calls: 890, status: "healthy" },
  { name: "/api/services", avgMs: 28, calls: 650, status: "healthy" },
  { name: "/api/invoices", avgMs: 78, calls: 420, status: "warning" },
  { name: "/api/analytics", avgMs: 156, calls: 230, status: "slow" },
  { name: "/api/blog", avgMs: 52, calls: 180, status: "healthy" },
];

const errorBreakdown = [
  { name: "4xx Client", value: 45, fill: "hsl(var(--accent))" },
  { name: "5xx Server", value: 12, fill: "hsl(var(--destructive))" },
  { name: "Timeout", value: 8, fill: "hsl(var(--primary))" },
  { name: "Network", value: 3, fill: "hsl(var(--muted-foreground))" },
];

const chartConfig = {
  api: { label: "API", color: "hsl(var(--primary))" },
  db: { label: "Database", color: "hsl(var(--accent))" },
  render: { label: "Render", color: "hsl(var(--muted-foreground))" },
};

const TestPerformanceMonitor = () => {
  const [score, setScore] = useState(87);

  useEffect(() => {
    const interval = setInterval(() => {
      setScore(Math.floor(Math.random() * 15) + 80);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const scoreColor = score >= 90 ? "text-green-500" : score >= 70 ? "text-yellow-500" : "text-destructive";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground font-display flex items-center gap-2">
          <Gauge className="w-6 h-6 text-primary" />
          Performance Monitoring
        </h2>
        <p className="text-muted-foreground mt-1">Application performance metrics and insights</p>
      </div>

      {/* Performance Score & Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="md:col-span-1 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="p-6 text-center">
            <div className="relative w-24 h-24 mx-auto mb-3">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke={score >= 90 ? "hsl(142,76%,36%)" : score >= 70 ? "hsl(48,96%,53%)" : "hsl(var(--destructive))"}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${score * 2.64} 264`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-2xl font-bold ${scoreColor}`}>{score}</span>
              </div>
            </div>
            <p className="text-sm font-semibold text-foreground">Performance Score</p>
            <Badge variant={score >= 90 ? "default" : "secondary"} className="mt-1 text-[10px]">
              {score >= 90 ? "Excellent" : score >= 70 ? "Good" : "Needs Work"}
            </Badge>
          </CardContent>
        </Card>

        {[
          { icon: Cpu, label: "Avg Response", value: "48ms", trend: "down", trendVal: "12%" },
          { icon: Database, label: "DB Queries", value: "3,240", trend: "up", trendVal: "8%" },
          { icon: HardDrive, label: "Cache Hit Rate", value: "94.2%", trend: "up", trendVal: "3%" },
          { icon: Wifi, label: "Throughput", value: "1.2k/s", trend: "up", trendVal: "5%" },
        ].map((metric, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <metric.icon className="w-5 h-5 text-primary" />
                <div className={`flex items-center gap-0.5 text-xs ${metric.trend === "down" ? "text-green-500" : "text-primary"}`}>
                  {metric.trend === "down" ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                  {metric.trendVal}
                </div>
              </div>
              <p className="text-xl font-bold text-foreground">{metric.value}</p>
              <p className="text-xs text-muted-foreground">{metric.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Response Time Trends
            </CardTitle>
            <CardDescription>API, Database, and Render times</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[280px]">
              <LineChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="api" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="db" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="render" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Error Breakdown</CardTitle>
            <CardDescription>By error type (last 24h)</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[200px]">
              <PieChart>
                <Pie data={errorBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                  {errorBreakdown.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
              {errorBreakdown.map((e, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: e.fill }} />
                  <span className="text-[11px] text-muted-foreground">{e.name}: {e.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Endpoint Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Endpoint Performance</CardTitle>
          <CardDescription>Average response times by API endpoint</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground py-3 px-2">Endpoint</th>
                  <th className="text-left text-xs font-medium text-muted-foreground py-3 px-2">Avg Response</th>
                  <th className="text-left text-xs font-medium text-muted-foreground py-3 px-2">Calls (24h)</th>
                  <th className="text-left text-xs font-medium text-muted-foreground py-3 px-2">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground py-3 px-2">Latency</th>
                </tr>
              </thead>
              <tbody>
                {endpointData.map((ep) => (
                  <tr key={ep.name} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-3 px-2 text-sm font-mono text-foreground">{ep.name}</td>
                    <td className="py-3 px-2 text-sm text-foreground">{ep.avgMs}ms</td>
                    <td className="py-3 px-2 text-sm text-muted-foreground">{ep.calls.toLocaleString()}</td>
                    <td className="py-3 px-2">
                      <Badge variant={ep.status === "healthy" ? "default" : ep.status === "warning" ? "secondary" : "destructive"} className="text-[10px]">
                        {ep.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 w-32">
                      <Progress value={Math.min(100, (ep.avgMs / 200) * 100)} className="h-1.5" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestPerformanceMonitor;

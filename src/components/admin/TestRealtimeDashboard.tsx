import { useState, useEffect } from "react";
import { Activity, TrendingUp, Users, Zap, Globe, Clock, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, ResponsiveContainer } from "recharts";

const generateLiveData = () => {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const time = new Date(now.getTime() - (11 - i) * 5000);
    return {
      time: time.toLocaleTimeString("en-US", { hour12: false, minute: "2-digit", second: "2-digit" }),
      requests: Math.floor(Math.random() * 100) + 20,
      latency: Math.floor(Math.random() * 200) + 50,
      errors: Math.floor(Math.random() * 5),
    };
  });
};

const hourlyData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  visitors: Math.floor(Math.random() * 500) + 50,
  pageViews: Math.floor(Math.random() * 1200) + 100,
}));

const chartConfig = {
  requests: { label: "Requests", color: "hsl(var(--primary))" },
  latency: { label: "Latency (ms)", color: "hsl(var(--accent))" },
  errors: { label: "Errors", color: "hsl(var(--destructive))" },
  visitors: { label: "Visitors", color: "hsl(var(--primary))" },
  pageViews: { label: "Page Views", color: "hsl(var(--accent))" },
};

const TestRealtimeDashboard = () => {
  const [liveData, setLiveData] = useState(generateLiveData());
  const [activeUsers, setActiveUsers] = useState(Math.floor(Math.random() * 50) + 10);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      setLiveData((prev) => {
        const newPoint = {
          time: new Date().toLocaleTimeString("en-US", { hour12: false, minute: "2-digit", second: "2-digit" }),
          requests: Math.floor(Math.random() * 100) + 20,
          latency: Math.floor(Math.random() * 200) + 50,
          errors: Math.floor(Math.random() * 5),
        };
        return [...prev.slice(1), newPoint];
      });
      setActiveUsers(Math.floor(Math.random() * 50) + 10);
    }, 3000);
    return () => clearInterval(interval);
  }, [isLive]);

  const latestReq = liveData[liveData.length - 1]?.requests ?? 0;
  const prevReq = liveData[liveData.length - 2]?.requests ?? 0;
  const reqTrend = latestReq >= prevReq;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-display">Real-Time Dashboard</h2>
          <p className="text-muted-foreground mt-1">Live system metrics and analytics</p>
        </div>
        <button
          onClick={() => setIsLive(!isLive)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isLive ? "bg-green-500/10 text-green-600 border border-green-500/30" : "bg-muted text-muted-foreground border border-border"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isLive ? "bg-green-500 animate-pulse" : "bg-muted-foreground"}`} />
          {isLive ? "LIVE" : "PAUSED"}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-primary" />
              <Badge variant={reqTrend ? "default" : "destructive"} className="text-[10px]">
                {reqTrend ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                {Math.abs(latestReq - prevReq)}%
              </Badge>
            </div>
            <p className="text-2xl font-bold text-foreground">{activeUsers}</p>
            <p className="text-xs text-muted-foreground">Active Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-5 h-5 text-accent" />
              <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${isLive ? "animate-spin" : ""}`} style={{ animationDuration: "3s" }} />
            </div>
            <p className="text-2xl font-bold text-foreground">{latestReq}</p>
            <p className="text-xs text-muted-foreground">Requests/5s</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{liveData[liveData.length - 1]?.latency ?? 0}ms</p>
            <p className="text-xs text-muted-foreground">Avg Latency</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-5 h-5 text-destructive" />
            </div>
            <p className="text-2xl font-bold text-foreground">{liveData[liveData.length - 1]?.errors ?? 0}</p>
            <p className="text-xs text-muted-foreground">Error Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Live Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Live Request Volume
            </CardTitle>
            <CardDescription>Requests per 5-second interval</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px]">
              <AreaChart data={liveData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="time" className="text-muted-foreground" tick={{ fontSize: 10 }} />
                <YAxis className="text-muted-foreground" tick={{ fontSize: 10 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <defs>
                  <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="requests" stroke="hsl(var(--primary))" fill="url(#reqGrad)" strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="w-4 h-4 text-accent" />
              Hourly Visitor Distribution
            </CardTitle>
            <CardDescription>Visitors & page views by hour</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px]">
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="hour" className="text-muted-foreground" tick={{ fontSize: 10 }} interval={3} />
                <YAxis className="text-muted-foreground" tick={{ fontSize: 10 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="visitors" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pageViews" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} opacity={0.6} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* System Health Bars */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">System Resource Utilization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: "CPU Usage", value: 42, color: "bg-primary" },
            { label: "Memory", value: 67, color: "bg-accent" },
            { label: "Disk I/O", value: 23, color: "bg-primary" },
            { label: "Network", value: 55, color: "bg-accent" },
          ].map((metric) => (
            <div key={metric.label} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{metric.label}</span>
                <span className="font-medium text-foreground">{metric.value}%</span>
              </div>
              <Progress value={metric.value} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default TestRealtimeDashboard;

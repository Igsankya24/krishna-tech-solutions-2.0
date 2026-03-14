import { useState } from "react";
import { Brain, Send, Sparkles, Lightbulb, BarChart3, Shield, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const suggestions = [
  { icon: BarChart3, label: "Show today's analytics summary", color: "text-primary" },
  { icon: Shield, label: "Run a security audit check", color: "text-destructive" },
  { icon: Lightbulb, label: "Suggest performance improvements", color: "text-accent" },
  { icon: Zap, label: "Automate repetitive tasks", color: "text-primary" },
];

const mockResponses: Record<string, string> = {
  default: "I'm your AI Admin Assistant. I can help you analyze data, generate reports, monitor system health, and suggest optimizations. What would you like to explore?",
  analytics: "📊 **Today's Summary:**\n- **42** new users registered\n- **128** appointments booked\n- **96%** system uptime\n- Revenue is **up 12%** from yesterday\n\nWould you like me to generate a detailed report?",
  security: "🔒 **Security Audit Results:**\n- All RLS policies are active ✅\n- No failed login attempts in last hour ✅\n- 2 users with outdated sessions ⚠️\n- API rate limits are within bounds ✅\n\nOverall security score: **94/100**",
  performance: "⚡ **Performance Insights:**\n1. Database queries averaging **45ms** — Good\n2. Consider adding indexes on `appointments.appointment_date`\n3. Image compression could save **~30%** bandwidth\n4. Cache frequently accessed site settings\n\nShall I create optimization tasks?",
  automate: "🤖 **Automation Suggestions:**\n1. Auto-archive appointments older than 90 days\n2. Schedule weekly backup at off-peak hours\n3. Auto-notify users of upcoming appointments\n4. Generate monthly revenue reports automatically\n\nWant me to set up any of these?",
};

const TestAIAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "assistant", content: mockResponses.default, timestamp: new Date() },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: messageText, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Mock AI response
    setTimeout(() => {
      const lowerText = messageText.toLowerCase();
      let response = mockResponses.default;
      if (lowerText.includes("analytic") || lowerText.includes("summary")) response = mockResponses.analytics;
      else if (lowerText.includes("security") || lowerText.includes("audit")) response = mockResponses.security;
      else if (lowerText.includes("performance") || lowerText.includes("improv")) response = mockResponses.performance;
      else if (lowerText.includes("automat") || lowerText.includes("task")) response = mockResponses.automate;

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: response, timestamp: new Date() },
      ]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground font-display flex items-center gap-2">
          <Brain className="w-6 h-6 text-primary" />
          AI Admin Assistant
        </h2>
        <p className="text-muted-foreground mt-1">Your intelligent admin co-pilot</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Area */}
        <Card className="lg:col-span-2">
          <CardContent className="p-0 flex flex-col" style={{ height: "500px" }}>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-line ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-border p-4">
              <form
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask the AI assistant..."
                  className="flex-1"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="p-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </CardContent>
        </Card>

        {/* Suggestions Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Quick Prompts
              </CardTitle>
              <CardDescription>Click to ask the AI</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s.label)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                  <span className="text-sm text-foreground">{s.label}</span>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <CardContent className="p-4 text-center">
              <Badge className="mb-2">Experimental</Badge>
              <p className="text-xs text-muted-foreground mt-2">
                This AI assistant uses mock responses for testing. Connect to Lovable AI for real intelligence.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TestAIAssistant;

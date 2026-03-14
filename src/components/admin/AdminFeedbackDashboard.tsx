import { useState, useEffect } from "react";
import { MessageCircle, Star, TrendingUp, ThumbsUp, ThumbsDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/services/database";

const AdminFeedbackDashboard = () => {
  const [stats, setStats] = useState({ totalTestimonials: 0, avgRating: 0, totalMessages: 0, unreadMessages: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [testimonials, messages, unread] = await Promise.all([
      supabase.from("testimonials").select("rating"),
      supabase.from("contact_messages").select("id", { count: "exact", head: true }),
      supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("is_read", false),
    ]);

    const ratings = testimonials.data?.map(t => t.rating || 5) || [];
    const avg = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    setStats({
      totalTestimonials: ratings.length,
      avgRating: Math.round(avg * 10) / 10,
      totalMessages: messages.count || 0,
      unreadMessages: unread.count || 0,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground font-display">Customer Feedback Dashboard</h2>
        <p className="text-muted-foreground text-sm mt-1">Overview of customer satisfaction and feedback.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center">
          <Star className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-foreground">{stats.avgRating}</p>
          <p className="text-xs text-muted-foreground">Avg. Rating</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <ThumbsUp className="w-6 h-6 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-foreground">{stats.totalTestimonials}</p>
          <p className="text-xs text-muted-foreground">Testimonials</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <MessageCircle className="w-6 h-6 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold text-foreground">{stats.totalMessages}</p>
          <p className="text-xs text-muted-foreground">Total Messages</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <MessageCircle className="w-6 h-6 text-accent mx-auto mb-2" />
          <p className="text-2xl font-bold text-foreground">{stats.unreadMessages}</p>
          <p className="text-xs text-muted-foreground">Unread</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Rating Distribution</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(rating => (
              <div key={rating} className="flex items-center gap-2">
                <span className="text-xs w-8 text-muted-foreground">{rating}★</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${rating * 20}%` }} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminFeedbackDashboard;

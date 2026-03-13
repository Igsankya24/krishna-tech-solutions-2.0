import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import ServiceCard from "@/components/ServiceCard";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import {
  HardDrive, RefreshCw, KeyRound, Wrench, Shield, Zap, ArrowRight, Phone, Clock, Award,
  Globe, Laptop, Database, Settings, Wifi, LucideIcon, Star, Quote, ChevronRight,
} from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
}

interface Testimonial {
  id: string;
  name: string;
  role: string | null;
  company: string | null;
  content: string;
  rating: number;
  avatar_url: string | null;
}

const iconMap: Record<string, LucideIcon> = {
  HardDrive, RefreshCw, KeyRound, Wrench, Shield, Zap, Globe, Laptop, Database, Settings, Wifi,
};

const Index = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const { settings: s } = useSiteSettings();

  useEffect(() => {
    fetchServices();
    fetchTestimonials();
  }, []);

  const fetchServices = async () => {
    const { data } = await supabase
      .from("services")
      .select("id, name, description, icon")
      .eq("is_visible", true)
      .order("display_order", { ascending: true })
      .limit(4);
    if (data) setServices(data);
    setLoading(false);
  };

  const fetchTestimonials = async () => {
    const { data } = await supabase
      .from("testimonials")
      .select("id, name, role, company, content, rating, avatar_url")
      .eq("is_visible", true)
      .order("display_order", { ascending: true })
      .limit(6);
    if (data) setTestimonials(data);
  };

  const stats = [
    { value: s.stat_1_value || "10K+", label: s.stat_1_label || "Happy Customers" },
    { value: s.stat_2_value || "95%", label: s.stat_2_label || "Recovery Rate" },
    { value: s.stat_3_value || "5+", label: s.stat_3_label || "Years Experience" },
    { value: s.stat_4_value || "24/7", label: s.stat_4_label || "Support Available" },
  ];

  const whyUs = [
    { icon: Shield, title: s.whyus_feature1_title || "100% Data Safety", description: s.whyus_feature1_desc || "Your data security is our top priority. We follow strict protocols." },
    { icon: Zap, title: s.whyus_feature2_title || "Fast Turnaround", description: s.whyus_feature2_desc || "Most services completed within 24-48 hours." },
    { icon: Award, title: s.whyus_feature3_title || "Expert Technicians", description: s.whyus_feature3_desc || "Certified professionals with years of experience." },
  ];

  return (
    <Layout>
      {/* Hero — Full-bleed editorial layout */}
      <section className="hero-section relative overflow-hidden">
        {/* Ambient light effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent/8 rounded-full blur-[100px]" />
        </div>

        <div className="container mx-auto px-4 relative z-10 pt-24 pb-20 md:pt-32 md:pb-28">
          {/* Top badge */}
          <div className="flex justify-center mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-hero-foreground/5 border border-hero-foreground/10 text-hero-foreground/70 text-xs font-medium backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-slow" />
              {s.hero_badge || "Trusted Tech Solutions Since 2022"}
            </span>
          </div>

          {/* Main heading — large, editorial */}
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-hero-foreground leading-[1.05] tracking-tight mb-6">
              {s.hero_title_1 || "Your Data is"}{" "}
              <span className="gradient-text">{s.hero_title_highlight || "Precious"}</span>
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>
              {s.hero_title_2 || "We Recover It"}
            </h1>

            <p className="text-base md:text-lg text-hero-foreground/50 max-w-xl mx-auto mb-10 leading-relaxed">
              {s.hero_description || "Professional data recovery, Windows services, and computer repairs. Expert solutions with no data loss guarantee."}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to={s.hero_btn1_link || "/contact"}>
                <Button variant="hero" size="lg" className="w-full sm:w-auto">
                  {s.hero_btn1_text || "Get Free Consultation"}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <Link to={s.hero_btn2_link || "/services"}>
                <Button variant="heroOutline" size="lg" className="w-full sm:w-auto">
                  {s.hero_btn2_text || "View Services"}
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats strip — horizontal, minimal */}
          <div className="max-w-3xl mx-auto mt-20 grid grid-cols-2 md:grid-cols-4 gap-px bg-hero-foreground/5 rounded-2xl overflow-hidden">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-hero/80 backdrop-blur-sm px-4 py-5 text-center">
                <p className="font-display text-2xl md:text-3xl font-bold text-hero-foreground">{stat.value}</p>
                <p className="text-hero-foreground/40 text-xs mt-1 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services — Asymmetric grid */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
            <div>
              <span className="text-xs font-semibold tracking-widest uppercase text-primary">{s.home_services_badge || "Our Services"}</span>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-2 tracking-tight">{s.home_services_title || "What We Offer"}</h2>
            </div>
            <Link to="/services">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground group">
                {s.home_services_btn || "View All Services"}
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {loading ? (
              <div className="col-span-2 text-center py-8 text-muted-foreground">Loading services...</div>
            ) : services.length > 0 ? (
              services.map((service) => (
                <ServiceCard key={service.id} id={service.id} icon={iconMap[service.icon || "Globe"] || Globe} title={service.name} description={service.description || ""} />
              ))
            ) : (
              <div className="col-span-2 text-center py-8 text-muted-foreground">No services available</div>
            )}
          </div>
        </div>
      </section>

      {/* Testimonials — Masonry-style cards */}
      {testimonials.length > 0 && (
        <section className="py-20 md:py-28 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14">
              <span className="text-xs font-semibold tracking-widest uppercase text-primary">{s.testimonials_badge || "Testimonials"}</span>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-2 tracking-tight">{s.testimonials_title || "What Our Customers Say"}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {testimonials.map((t) => (
                <div key={t.id} className="bg-card rounded-2xl p-6 border border-border/50 card-shadow relative group">
                  <Quote className="absolute top-5 right-5 w-6 h-6 text-primary/10 group-hover:text-primary/20 transition-colors" />
                  <div className="flex items-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`w-3.5 h-3.5 ${star <= t.rating ? "text-accent fill-accent" : "text-border"}`} />
                    ))}
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-5 line-clamp-4">"{t.content}"</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                      {t.avatar_url ? <img src={t.avatar_url} alt={t.name} className="w-full h-full object-cover" /> : <span className="text-muted-foreground text-sm font-bold">{t.name.charAt(0)}</span>}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role && t.company ? `${t.role}, ${t.company}` : t.role || t.company || "Customer"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why Choose Us — Side-by-side editorial */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-5 gap-12 lg:gap-16 items-start">
            {/* Left content — 3 cols */}
            <div className="lg:col-span-3">
              <span className="text-xs font-semibold tracking-widest uppercase text-primary">{s.whyus_badge || "Why Choose Us"}</span>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-2 mb-8 tracking-tight">{s.whyus_title || "Trusted by Thousands of Customers"}</h2>
              <p className="text-muted-foreground mb-10 text-base max-w-lg">{s.whyus_description || "We combine expertise with cutting-edge technology."}</p>
              
              <div className="space-y-6">
                {whyUs.map((item, idx) => (
                  <div key={idx} className="flex gap-4 p-4 rounded-xl bg-muted/40 border border-border/50 hover:border-primary/20 transition-colors">
                    <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-foreground mb-1">{item.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right contact card — 2 cols */}
            <div className="lg:col-span-2 lg:sticky lg:top-24">
              <div className="bg-card rounded-2xl p-7 card-shadow border border-border/50">
                <h3 className="font-display text-xl font-bold text-foreground mb-5">{s.whyus_contact_title || "Quick Contact"}</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-muted/50 border border-border/30">
                    <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Call Us Now</p>
                      <p className="font-semibold text-foreground text-sm">{s.contact_phone || "+91 7026292525"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-muted/50 border border-border/30">
                    <Clock className="w-5 h-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Working Hours</p>
                      <p className="font-semibold text-foreground text-sm">{s.whyus_working_hours || "Mon-Sat: 9AM - 8PM"}</p>
                    </div>
                  </div>
                </div>
                <Link to="/contact" className="block mt-5">
                  <Button className="w-full" size="lg">{s.whyus_btn_text || "Book Appointment"}</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA — Centered, dramatic */}
      <section className="hero-section relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 left-1/3 w-[250px] h-[250px] bg-accent/10 rounded-full blur-[80px]" />
        </div>
        <div className="container mx-auto px-4 relative z-10 py-20 md:py-28">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-3xl md:text-5xl font-bold text-hero-foreground mb-5 tracking-tight">
              {s.cta_title_1 || "Lost Your Data?"}<br />
              <span className="gradient-text">{s.cta_title_highlight || "We Can Help!"}</span>
            </h2>
            <p className="text-hero-foreground/50 text-base mb-8 max-w-md mx-auto">{s.cta_description || "Contact us for a free consultation."}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to={s.cta_btn_link || "/contact"}>
                <Button variant="hero" size="lg" className="w-full sm:w-auto">
                  {s.cta_btn_text || "Contact Us Now"}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <a href={`tel:${s.contact_phone || "+917026292525"}`}>
                <Button variant="heroOutline" size="lg" className="w-full sm:w-auto">
                  <Phone className="w-4 h-4 mr-1.5" />
                  Call: {s.contact_phone || "+91 7026292525"}
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;

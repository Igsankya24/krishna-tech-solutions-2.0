import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import ServiceCard from "@/components/ServiceCard";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Monitor, Smartphone, Globe, Shield, Database, Headphones, Code, Server, Cloud, Lock, Zap, Settings, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  features: string[];
  price: number | null;
  is_visible: boolean;
}

const iconMap: Record<string, LucideIcon> = {
  Globe, Smartphone, Monitor, Shield, Database, Headphones, Code, Server, Cloud, Lock, Zap, Settings,
};

const Services = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const { settings: s } = useSiteSettings();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("is_visible", true)
      .order("display_order", { ascending: true });

    if (!error && data) {
      setServices(data);
    }
    setLoading(false);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="hero-section relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-20">
          <div className="absolute inset-0">
            <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-primary/8 rounded-full blur-[100px]" />
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-2xl">
              <span className="text-xs font-semibold tracking-widest uppercase text-primary">{s.services_hero_badge || "What We Do"}</span>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-hero-foreground mt-3 mb-4 tracking-tight">
                {s.services_hero_title || "Our Services"}
              </h1>
              <p className="text-hero-foreground/50 text-base md:text-lg max-w-lg leading-relaxed">
                {s.services_hero_desc || "Comprehensive technology solutions tailored to meet your business needs and drive digital transformation."}
              </p>
            </div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : services.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {services.map((service) => (
                  <ServiceCard
                    key={service.id}
                    id={service.id}
                    title={service.name}
                    description={service.description || ""}
                    icon={iconMap[service.icon] || Globe}
                    features={service.features || []}
                    price={service.price ? `₹${service.price.toLocaleString('en-IN')}` : undefined}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No services available at the moment.</p>
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3 tracking-tight">
                {s.services_cta_title || "Ready to Get Started?"}
              </h2>
              <p className="text-muted-foreground mb-6 text-sm md:text-base max-w-md mx-auto">
                {s.services_cta_desc || "Contact us today to discuss your project requirements and get a free consultation."}
              </p>
              <Link to="/contact">
                <Button size="lg">
                  {s.services_cta_btn || "Contact Us"}
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Services;

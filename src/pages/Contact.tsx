import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Phone, Mail, MapPin, Clock, Send, MessageSquare } from "lucide-react";
import { supabase } from "@/services/database";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface Service {
  id: string;
  name: string;
}

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", service: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const { settings: s } = useSiteSettings();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const { data } = await supabase.from("services").select("id, name").eq("is_visible", true).order("display_order");
    if (data) setServices(data);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: formData.name, email: formData.email, phone: formData.phone, subject: formData.service, message: formData.message, source: "contact_form",
    });
    if (error) {
      toast({ title: "Error", description: "Failed to send message. Please try again.", variant: "destructive" });
    } else {
      toast({ title: "Message Sent! ✓", description: "We'll get back to you within 24 hours." });
      setFormData({ name: "", email: "", phone: "", service: "", message: "" });
    }
    setIsSubmitting(false);
  };

  const contactInfo = [
    { icon: Phone, title: "Phone", details: [s.contact_phone || "+91 7026292525", s.contact_phone_2 || ""].filter(Boolean) },
    { icon: Mail, title: "Email", details: [s.contact_email || "info@krishnatechsolutions.com", s.contact_email_2 || ""].filter(Boolean) },
    { icon: MapPin, title: "Address", details: [s.contact_address || "Belgaum, Karnataka, 590014"] },
    { icon: Clock, title: "Working Hours", details: [s.business_hours || "Monday - Saturday, 9:00 AM - 8:00 PM"] },
  ];

  return (
    <Layout>
      {/* Hero — Minimal */}
      <section className="hero-section relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-20">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/3 w-[400px] h-[400px] bg-primary/8 rounded-full blur-[100px]" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold tracking-widest uppercase text-primary">{s.contact_hero_badge || "Contact Us"}</span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-hero-foreground mt-3 mb-5 tracking-tight">
              {s.contact_hero_title1 || "Get in"}{" "}
              <span className="gradient-text">{s.contact_hero_highlight || "Touch"}</span>
            </h1>
            <p className="text-hero-foreground/50 text-base md:text-lg max-w-lg leading-relaxed">
              {s.contact_hero_desc || "Have a question or need our services? We're here to help! Reach out to us and we'll respond within 24 hours."}
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-5 gap-10 lg:gap-14">
            {/* Contact Form — 3 cols */}
            <div className="lg:col-span-3">
              <div className="bg-card rounded-2xl p-6 md:p-8 card-shadow border border-border/50">
                <div className="flex items-center gap-3 mb-7">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold text-foreground">{s.contact_form_title || "Send a Message"}</h2>
                    <p className="text-muted-foreground text-xs">{s.contact_form_subtitle || "Fill out the form and we'll get back to you"}</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1.5 uppercase tracking-wider">Your Name</label>
                      <Input name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" required className="h-11" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1.5 uppercase tracking-wider">Phone Number</label>
                      <Input name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 1234567890" required className="h-11" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5 uppercase tracking-wider">Email Address</label>
                    <Input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" required className="h-11" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5 uppercase tracking-wider">Service Required</label>
                    <select name="service" value={formData.service} onChange={handleChange} required className="w-full h-11 px-4 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                      <option value="">Select a service</option>
                      {services.map((service) => (
                        <option key={service.id} value={service.name}>{service.name}</option>
                      ))}
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5 uppercase tracking-wider">Your Message</label>
                    <Textarea name="message" value={formData.message} onChange={handleChange} placeholder="Describe your issue or requirement..." required rows={4} className="resize-none" />
                  </div>
                  <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Sending..." : <>{s.contact_form_btn || "Send Message"}<Send className="w-4 h-4 ml-2" /></>}
                  </Button>
                </form>
              </div>
            </div>

            {/* Contact Info — 2 cols */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="font-display text-xl font-bold text-foreground mb-2">{s.contact_info_title || "Contact Information"}</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {s.contact_info_subtitle || "Reach out to us through any of these channels. We're always happy to help!"}
                </p>
              </div>

              <div className="space-y-3">
                {contactInfo.map((info, idx) => (
                  <div key={idx} className="flex gap-3.5 p-4 rounded-xl bg-muted/40 border border-border/50 hover:border-primary/20 transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-primary/8 border border-primary/10 flex items-center justify-center flex-shrink-0">
                      <info.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm mb-0.5">{info.title}</h3>
                      {info.details.map((detail, i) => (
                        <p key={i} className="text-muted-foreground text-xs">{detail}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Map */}
              <div className="rounded-xl overflow-hidden border border-border/50 h-52 bg-muted">
                {s.google_maps_embed_url ? (
                  <iframe src={s.google_maps_embed_url} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Location" />
                ) : s.google_maps_url ? (
                  <iframe src={s.google_maps_url} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Location" />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center px-4">
                      <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm">{s.contact_address || "Belgaum, Karnataka - 590014"}</p>
                      <a href={`https://maps.google.com/?q=${encodeURIComponent(s.contact_address || "Belgaum Karnataka 590014")}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs">
                        Open in Google Maps →
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Full Width Map */}
      {(s.google_maps_embed_url || s.google_maps_url) && (
        <section className="py-0">
          <div className="w-full h-[300px] md:h-[350px] bg-muted">
            <iframe src={s.google_maps_embed_url || s.google_maps_url} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Full Width Location" />
          </div>
        </section>
      )}

      {/* FAQ CTA */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="bg-card rounded-2xl p-6 md:p-8 flex flex-col lg:flex-row items-center justify-between gap-6 border border-border/50 card-shadow">
            <div className="text-center lg:text-left">
              <h3 className="font-display text-xl font-bold text-foreground mb-1">{s.contact_cta_title || "Need Immediate Assistance?"}</h3>
              <p className="text-muted-foreground text-sm">{s.contact_cta_subtitle || "Call us directly for urgent tech support."}</p>
            </div>
            <a href={`tel:${s.contact_phone || "+917026292525"}`} className="w-full lg:w-auto">
              <Button size="lg" className="w-full lg:w-auto">
                <Phone className="w-4 h-4 mr-2" />
                Call: {s.contact_phone || "+91 7026292525"}
              </Button>
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;

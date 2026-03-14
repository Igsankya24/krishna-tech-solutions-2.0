import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Monitor, Phone, Mail, MapPin, Facebook, Twitter, Linkedin, Instagram, ArrowUpRight } from "lucide-react";
import { supabase } from "@/services/database";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface Service {
  id: string;
  name: string;
}

const Footer = () => {
  const { settings: s } = useSiteSettings();
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    const fetchServices = async () => {
      const { data } = await supabase.from("services").select("id, name").eq("is_visible", true).order("display_order", { ascending: true }).limit(5);
      if (data) setServices(data);
    };
    fetchServices();
  }, []);

  const socialLinks = [
    { icon: Facebook, url: s.facebook_link, name: "Facebook" },
    { icon: Twitter, url: s.twitter_link, name: "Twitter" },
    { icon: Instagram, url: s.instagram_link, name: "Instagram" },
    { icon: Linkedin, url: s.linkedin_link, name: "LinkedIn" },
  ].filter(link => link.url);

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-hero text-hero-foreground relative overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="container mx-auto px-4 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Monitor className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-base leading-tight">{s.company_name || "Krishna Tech"}</span>
                <span className="text-[10px] text-hero-foreground/50 -mt-0.5 font-medium tracking-wider uppercase">{s.company_tagline || "Solutions"}</span>
              </div>
            </div>
            <p className="text-hero-foreground/60 text-sm leading-relaxed max-w-xs">
              {s.footer_description || "Professional tech solutions for data recovery, Windows services, and computer repairs. Your trusted IT partner."}
            </p>
            <div className="flex gap-2 pt-1">
              {socialLinks.length > 0 ? (
                socialLinks.map((social, index) => (
                  <a key={index} href={social.url} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-hero-foreground/5 border border-hero-foreground/10 flex items-center justify-center hover:bg-primary hover:border-primary hover:text-primary-foreground transition-all duration-200" aria-label={social.name}>
                    <social.icon className="w-4 h-4" />
                  </a>
                ))
              ) : (
                [Facebook, Twitter, Instagram, Linkedin].map((Icon, index) => (
                  <a key={index} href="#" className="w-9 h-9 rounded-lg bg-hero-foreground/5 border border-hero-foreground/10 flex items-center justify-center hover:bg-primary hover:border-primary hover:text-primary-foreground transition-all duration-200">
                    <Icon className="w-4 h-4" />
                  </a>
                ))
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold text-sm tracking-wider uppercase text-hero-foreground/40 mb-5">Navigation</h4>
            <ul className="space-y-2.5">
              {[
                { name: "Home", path: "/" },
                { name: "Services", path: "/services" },
                { name: "About Us", path: "/about" },
                { name: "Contact", path: "/contact" },
              ].map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="text-hero-foreground/60 hover:text-hero-foreground text-sm transition-colors duration-200 flex items-center gap-1 group">
                    {link.name}
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-display font-semibold text-sm tracking-wider uppercase text-hero-foreground/40 mb-5">Services</h4>
            <ul className="space-y-2.5">
              {services.length > 0 ? (
                services.map((service) => (
                  <li key={service.id}><span className="text-hero-foreground/60 text-sm">{service.name}</span></li>
                ))
              ) : (
                ["Data Recovery", "Windows Upgrade", "Password Recovery", "Computer Repair", "Virus Removal"].map((service) => (
                  <li key={service}><span className="text-hero-foreground/60 text-sm">{service}</span></li>
                ))
              )}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold text-sm tracking-wider uppercase text-hero-foreground/40 mb-5">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-hero-foreground/60 text-sm">{s.contact_phone || "+91 7026292525"}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-hero-foreground/60 text-sm break-all">{s.contact_email || "info@krishnatechsolutions.com"}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-hero-foreground/60 text-sm">{s.contact_address || "Belgaum, Karnataka - 590014"}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-hero-foreground/8 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-hero-foreground/40 text-xs">
            {s.copyright_text || `© ${currentYear} Krishna Tech Solutions. All rights reserved.`}
          </p>
          <div className="flex gap-6">
            <a href={s.privacy_policy_url || "#"} className="text-hero-foreground/40 hover:text-hero-foreground/70 text-xs transition-colors">Privacy Policy</a>
            <a href={s.terms_of_service_url || "#"} className="text-hero-foreground/40 hover:text-hero-foreground/70 text-xs transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

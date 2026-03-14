import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/services/database";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Users, Target, Award, Heart, CheckCircle2, ArrowRight, Mail, Phone, Linkedin, Twitter } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  photo_url: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
}

const About = () => {
  const { settings: s } = useSiteSettings();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    const fetchTeam = async () => {
      const { data } = await supabase
        .from("team_members")
        .select("*")
        .eq("is_visible", true)
        .order("display_order", { ascending: true });
      if (data) setTeamMembers(data);
    };
    fetchTeam();
  }, []);

  const values = [
    { icon: Users, title: s.about_value1_title || "Customer First", description: s.about_value1_desc || "Your satisfaction is our priority. We go above and beyond to exceed expectations." },
    { icon: Target, title: s.about_value2_title || "Excellence", description: s.about_value2_desc || "We maintain the highest standards in every service we provide." },
    { icon: Award, title: s.about_value3_title || "Expertise", description: s.about_value3_desc || "Our team consists of certified professionals with years of experience." },
    { icon: Heart, title: s.about_value4_title || "Integrity", description: s.about_value4_desc || "We operate with complete transparency and honesty in all dealings." },
  ];

  const milestones = [
    { year: s.about_milestone1_year || "2019", title: s.about_milestone1_title || "Founded", desc: s.about_milestone1_desc || "Started our journey in tech solutions" },
    { year: s.about_milestone2_year || "2020", title: s.about_milestone2_title || "1000+ Customers", desc: s.about_milestone2_desc || "Reached our first major milestone" },
    { year: s.about_milestone3_year || "2022", title: s.about_milestone3_title || "Expanded Services", desc: s.about_milestone3_desc || "Added new service categories" },
    { year: s.about_milestone4_year || "2024", title: s.about_milestone4_title || "10000+ Customers", desc: s.about_milestone4_desc || "Trusted by thousands" },
  ];

  const storyStats = [
    { value: s.about_stat1_value || "10K+", label: s.about_stat1_label || "Happy Customers" },
    { value: s.about_stat2_value || "95%", label: s.about_stat2_label || "Recovery Rate" },
    { value: s.about_stat3_value || "5+", label: s.about_stat3_label || "Years Experience" },
    { value: s.about_stat4_value || "50+", label: s.about_stat4_label || "Services Offered" },
  ];

  const missionPoints = (s.about_mission_points || "Recover data that others say is lost forever,Upgrade systems without losing a single file,Provide transparent pricing with no hidden costs,Deliver exceptional customer service always").split(",");

  return (
    <Layout>
      {/* Hero — Left-aligned editorial */}
      <section className="hero-section relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-20">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-primary/8 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-1/3 w-[300px] h-[300px] bg-accent/6 rounded-full blur-[80px]" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold tracking-widest uppercase text-primary">{s.about_hero_badge || "About Us"}</span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-hero-foreground mt-3 mb-5 tracking-tight">
              {s.about_hero_title1 || "Your Trusted"}{" "}
              <span className="gradient-text">{s.about_hero_highlight || "Tech Partner"}</span>
            </h1>
            <p className="text-hero-foreground/50 text-base md:text-lg max-w-lg leading-relaxed">
              {s.about_hero_desc || "Krishna Tech Solutions has been providing reliable tech services since 2022. We're passionate about solving technology problems."}
            </p>
          </div>
        </div>
      </section>

      {/* Our Story — Clean editorial */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            <div>
              <span className="text-xs font-semibold tracking-widest uppercase text-primary">{s.about_story_badge || "Our Story"}</span>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-2 mb-6 tracking-tight">
                {s.about_story_title || "From Passion to Profession"}
              </h2>
              <div className="space-y-4 text-muted-foreground text-sm md:text-base leading-relaxed">
                <p>{s.about_story_p1 || "Krishna Tech Solutions was founded in 2019 with a simple mission: to provide honest, reliable, and affordable tech solutions to individuals and small businesses."}</p>
                <p>{s.about_story_p2 || "What started as a small data recovery service has grown into a comprehensive tech solutions provider. Our founder's passion for helping people recover their precious data led to the creation of this company."}</p>
                <p>{s.about_story_p3 || "Today, we serve over 10,000 satisfied customers and continue to expand our services to meet the evolving needs of our community."}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-8">
                {storyStats.map((stat, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-muted/50 border border-border/50">
                    <p className="font-display text-xl md:text-2xl font-bold gradient-text">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-muted/30 rounded-2xl p-7 md:p-9 border border-border/50 lg:sticky lg:top-24">
              <h3 className="font-display text-xl font-bold text-foreground mb-4">
                {s.about_mission_title || "Our Mission"}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                {s.about_mission_desc || "To provide accessible, affordable, and reliable tech solutions that empower our customers to make the most of their technology without the fear of data loss or system failures."}
              </p>
              <div className="space-y-3">
                {missionPoints.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground text-sm">{item.trim()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values — Compact grid */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold tracking-widest uppercase text-primary">{s.about_values_badge || "Our Values"}</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-2 tracking-tight">
              {s.about_values_title || "What Drives Us"}
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {values.map((value, idx) => (
              <div key={idx} className="bg-card rounded-xl p-5 md:p-6 text-center card-shadow border border-border/50">
                <div className="w-10 h-10 rounded-lg bg-primary/8 border border-primary/10 flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-sm md:text-base text-foreground mb-2">{value.title}</h3>
                <p className="text-muted-foreground text-xs md:text-sm leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline — Clean vertical */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold tracking-widest uppercase text-primary">{s.about_timeline_badge || "Our Journey"}</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-2 tracking-tight">
              {s.about_timeline_title || "Key Milestones"}
            </h2>
          </div>

          <div className="max-w-2xl mx-auto">
            {milestones.map((milestone, idx) => (
              <div key={idx} className="flex gap-5 mb-8 last:mb-0">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-display font-bold text-xs flex-shrink-0">
                    {milestone.year}
                  </div>
                  {idx < milestones.length - 1 && (
                    <div className="w-px flex-1 bg-border mt-3" />
                  )}
                </div>
                <div className="pb-8">
                  <h3 className="font-display font-bold text-foreground">{milestone.title}</h3>
                  <p className="text-muted-foreground text-sm mt-0.5">{milestone.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      {teamMembers.length > 0 && (
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <span className="text-xs font-semibold tracking-widest uppercase text-primary">{s.about_team_badge || "Our Leadership"}</span>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-2 tracking-tight">
                {s.about_team_title || "Meet Our Team"}
              </h2>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {teamMembers.map((member) => {
                const cardShape = s.team_card_shape || "rounded";
                const photoShape = cardShape === "circle" ? "rounded-full" : cardShape === "square" ? "rounded-none" : "rounded-xl";
                const cardRadius = cardShape === "circle" ? "rounded-2xl" : cardShape === "square" ? "rounded-none" : "rounded-xl";
                
                return (
                  <div key={member.id} className={`bg-card ${cardRadius} p-5 text-center card-shadow border border-border/50`}>
                    <div className={`w-14 h-14 ${photoShape} bg-muted flex items-center justify-center mx-auto mb-3 overflow-hidden`}>
                      {member.photo_url ? (
                        <img src={member.photo_url} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-display font-bold text-primary">{member.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <h3 className="font-display font-bold text-sm text-foreground mb-0.5">{member.name}</h3>
                    <p className="text-primary text-xs mb-2">{member.role}</p>
                    {member.bio && <p className="text-muted-foreground text-xs mb-3 line-clamp-2 leading-relaxed">{member.bio}</p>}
                    <div className="flex items-center justify-center gap-1.5">
                      {member.email && (
                        <a href={`mailto:${member.email}`} className="p-1.5 rounded-md bg-muted hover:bg-primary/10 transition-colors">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                        </a>
                      )}
                      {member.phone && (
                        <a href={`tel:${member.phone}`} className="p-1.5 rounded-md bg-muted hover:bg-primary/10 transition-colors">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                        </a>
                      )}
                      {member.linkedin_url && (
                        <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md bg-muted hover:bg-primary/10 transition-colors">
                          <Linkedin className="w-3 h-3 text-muted-foreground" />
                        </a>
                      )}
                      {member.twitter_url && (
                        <a href={member.twitter_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md bg-muted hover:bg-primary/10 transition-colors">
                          <Twitter className="w-3 h-3 text-muted-foreground" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="hero-section relative overflow-hidden py-20 md:py-24">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[100px]" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-hero-foreground mb-4 tracking-tight">
              {s.about_cta_title || "Ready to Work With Us?"}
            </h2>
            <p className="text-hero-foreground/50 mb-8 text-sm md:text-base">
              {s.about_cta_desc || "Let's solve your tech challenges together. Contact us today!"}
            </p>
            <Link to="/contact">
              <Button variant="hero" size="lg">
                {s.about_cta_btn || "Get in Touch"}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default About;

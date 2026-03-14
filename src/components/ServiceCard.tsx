import { LucideIcon, Calendar, ChevronDown, ExternalLink, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/services/database";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ServiceProject {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  project_url: string | null;
}

interface ServiceCardProps {
  id?: string;
  icon: LucideIcon;
  title: string;
  description: string;
  features?: string[];
  price?: string;
}

const ServiceCard = ({ id, icon: Icon, title, description, features, price }: ServiceCardProps) => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ServiceProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProjects();
    }
  }, [id]);

  const fetchProjects = async () => {
    if (!id) return;
    setLoadingProjects(true);
    const { data } = await supabase
      .from("service_projects")
      .select("id, title, description, image_url, project_url")
      .eq("service_id", id)
      .eq("is_visible", true)
      .order("display_order", { ascending: true });
    
    if (data) {
      setProjects(data);
    }
    setLoadingProjects(false);
  };

  const handleBookNow = () => {
    if (id) {
      sessionStorage.setItem("chatbot_preselect_service", JSON.stringify({ id, title }));
      window.dispatchEvent(new CustomEvent("openChatbotBooking", { detail: { serviceId: id, serviceName: title } }));
    }
  };

  return (
    <div className="group bg-card rounded-2xl p-6 md:p-7 border border-border/50 hover:border-primary/20 transition-all duration-300 card-shadow">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-11 h-11 rounded-xl bg-primary/8 border border-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/12 transition-colors">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-lg text-card-foreground mb-1 tracking-tight">{title}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">{description}</p>
        </div>
      </div>

      {features && features.length > 0 && (
        <ul className="space-y-1.5 mb-4 pl-[60px]">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-1 h-1 rounded-full bg-primary/60 flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
      )}

      {price && (
        <div className="pt-3 mt-3 border-t border-border/50 pl-[60px]">
          <span className="text-xs text-muted-foreground">Starting from</span>
          <p className="font-display font-bold text-xl text-primary">{price}</p>
        </div>
      )}

      <div className="flex gap-2 mt-4 pl-[60px]">
        {projects.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" className="text-xs">
                <FolderOpen className="w-3.5 h-3.5 mr-1.5" />
                Our Work ({projects.length})
                <ChevronDown className="w-3.5 h-3.5 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 bg-popover border border-border shadow-lg z-50">
              {projects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                  onClick={() => {
                    if (project.project_url) {
                      window.open(project.project_url, "_blank");
                    }
                  }}
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="font-medium text-foreground">{project.title}</span>
                    {project.project_url && (
                      <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto" />
                    )}
                  </div>
                  {project.description && (
                    <span className="text-xs text-muted-foreground line-clamp-2">
                      {project.description}
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {id && (
          <Button onClick={handleBookNow} variant="outline" size="sm" className="text-xs">
            <Calendar className="w-3.5 h-3.5 mr-1.5" />
            Book Now
          </Button>
        )}
      </div>
    </div>
  );
};

export default ServiceCard;

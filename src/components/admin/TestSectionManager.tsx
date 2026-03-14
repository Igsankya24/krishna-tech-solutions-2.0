import { useState } from "react";
import { GripVertical, ArrowRight, ArrowLeft, Layers, Beaker, ChevronDown, ChevronRight, Save, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface ModuleItem {
  id: string;
  label: string;
  section: "main" | "more" | "test";
}

const initialModules: ModuleItem[] = [
  { id: "command-palette", label: "Command Palette", section: "test" },
  { id: "realtime-dashboard", label: "Real-Time Dashboard", section: "test" },
  { id: "ai-assistant", label: "AI Admin Assistant", section: "test" },
  { id: "smart-alerts", label: "Smart Alerts", section: "test" },
  { id: "performance-monitor", label: "Performance Monitoring", section: "test" },
];

const sectionLabels = {
  main: "Main Section",
  more: "More Features",
  test: "Test Features",
};

const sectionColors = {
  main: "bg-primary/10 text-primary border-primary/30",
  more: "bg-accent/10 text-accent border-accent/30",
  test: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
};

const TestSectionManager = () => {
  const [modules, setModules] = useState(initialModules);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    main: true, more: true, test: true,
  });
  const { toast } = useToast();

  const moveModule = (moduleId: string, newSection: "main" | "more" | "test") => {
    setModules(prev => prev.map(m => m.id === moduleId ? { ...m, section: newSection } : m));
    const mod = modules.find(m => m.id === moduleId);
    toast({
      title: "Module Moved",
      description: `"${mod?.label}" moved to ${sectionLabels[newSection]}`,
    });
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItem(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, section: "main" | "more" | "test") => {
    e.preventDefault();
    if (draggedItem) {
      moveModule(draggedItem, section);
      setDraggedItem(null);
    }
  };

  const resetModules = () => {
    setModules(initialModules);
    toast({ title: "Reset", description: "All modules returned to original sections" });
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getModulesBySection = (section: "main" | "more" | "test") =>
    modules.filter(m => m.section === section);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-display flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary" />
            Section Manager
          </h2>
          <p className="text-muted-foreground mt-1">Drag and drop modules between sections</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={resetModules}>
            <RotateCcw className="w-4 h-4 mr-1" /> Reset
          </Button>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
        <p className="text-sm text-foreground font-medium">🧪 How it works</p>
        <p className="text-xs text-muted-foreground mt-1">
          Drag modules between sections or use the arrow buttons. Changes are visual only and do not affect the actual admin panel layout in this prototype.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {(["main", "more", "test"] as const).map((section) => {
          const sectionModules = getModulesBySection(section);
          const isExpanded = expandedSections[section];
          const otherSections = (["main", "more", "test"] as const).filter(s => s !== section);

          return (
            <Card
              key={section}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, section)}
              className={`transition-all ${draggedItem ? "ring-2 ring-primary/30 ring-dashed" : ""}`}
            >
              <CardHeader className="pb-3">
                <button
                  onClick={() => toggleSection(section)}
                  className="flex items-center gap-2 w-full text-left"
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <CardTitle className="text-base flex-1">{sectionLabels[section]}</CardTitle>
                  <Badge variant="outline" className={`${sectionColors[section]} border text-[10px]`}>
                    {sectionModules.length}
                  </Badge>
                </button>
              </CardHeader>
              {isExpanded && (
                <CardContent className="space-y-2 min-h-[100px]">
                  {sectionModules.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed border-border rounded-lg">
                      Drop modules here
                    </div>
                  ) : (
                    sectionModules.map((mod) => (
                      <div
                        key={mod.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, mod.id)}
                        className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/30 cursor-grab active:cursor-grabbing transition-all group"
                      >
                        <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm font-medium text-foreground flex-1">{mod.label}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {otherSections.map((target) => (
                            <button
                              key={target}
                              onClick={() => moveModule(mod.id, target)}
                              className="p-1 rounded hover:bg-primary/10 transition-colors"
                              title={`Move to ${sectionLabels[target]}`}
                            >
                              <ArrowRight className="w-3.5 h-3.5 text-primary" />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Movement Log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Module Layout Summary</CardTitle>
          <CardDescription>Current placement of all test modules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(["main", "more", "test"] as const).map((section) => (
              <div key={section} className={`p-4 rounded-lg border ${sectionColors[section]}`}>
                <p className="text-sm font-semibold mb-2">{sectionLabels[section]}</p>
                {getModulesBySection(section).map((m) => (
                  <p key={m.id} className="text-xs text-muted-foreground">• {m.label}</p>
                ))}
                {getModulesBySection(section).length === 0 && (
                  <p className="text-xs text-muted-foreground italic">No modules</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestSectionManager;

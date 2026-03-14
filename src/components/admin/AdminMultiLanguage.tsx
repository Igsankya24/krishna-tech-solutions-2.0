import { useState } from "react";
import { Languages, Plus, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const AdminMultiLanguage = () => {
  const [languages] = useState([
    { code: "en", name: "English", isDefault: true, progress: 100 },
    { code: "hi", name: "Hindi", isDefault: false, progress: 0 },
    { code: "te", name: "Telugu", isDefault: false, progress: 0 },
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-display">Multi-Language Support</h2>
          <p className="text-muted-foreground text-sm mt-1">Manage website translations and language settings.</p>
        </div>
        <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Language</Button>
      </div>

      <div className="space-y-3">
        {languages.map((lang) => (
          <Card key={lang.code}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Languages className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{lang.name}</p>
                  <span className="text-xs font-mono text-muted-foreground">{lang.code}</span>
                  {lang.isDefault && <Badge>Default</Badge>}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[200px]">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${lang.progress}%` }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{lang.progress}% translated</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-muted/50 rounded-xl p-6 text-center">
        <Languages className="w-10 h-10 mx-auto mb-2 text-muted-foreground opacity-50" />
        <p className="text-sm text-muted-foreground">Full translation management with AI-powered auto-translation coming soon.</p>
      </div>
    </div>
  );
};

export default AdminMultiLanguage;

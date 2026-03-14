import { useState, useEffect } from "react";
import { FolderOpen, Upload, Trash2, Download, Image, File, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/services/database";
import { useToast } from "@/hooks/use-toast";

interface StorageFile {
  name: string;
  id: string;
  created_at: string;
  metadata: { size?: number; mimetype?: string } | null;
}

const BUCKETS = ["avatars", "technician-photos", "site-icons", "team-photos", "project-images", "blog-images", "testimonial-avatars", "backups"];

const AdminFileManager = () => {
  const [selectedBucket, setSelectedBucket] = useState(BUCKETS[0]);
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchFiles();
  }, [selectedBucket]);

  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.storage.from(selectedBucket).list("", { limit: 100, sortBy: { column: "created_at", order: "desc" } });
      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error("Error fetching files:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { error } = await supabase.storage.from(selectedBucket).upload(file.name, file, { upsert: true });
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "File uploaded", description: `${file.name} uploaded to ${selectedBucket}` });
      fetchFiles();
    }
  };

  const handleDelete = async (fileName: string) => {
    const { error } = await supabase.storage.from(selectedBucket).remove([fileName]);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "File deleted" });
      fetchFiles();
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = (mime?: string) => mime?.startsWith("image/");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-display">File & Media Manager</h2>
          <p className="text-muted-foreground text-sm mt-1">Browse, upload, and manage files across storage buckets.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchFiles}><RefreshCw className="w-4 h-4 mr-1" /> Refresh</Button>
          <label>
            <Button size="sm" asChild><span><Upload className="w-4 h-4 mr-1" /> Upload</span></Button>
            <input type="file" className="hidden" onChange={handleUpload} />
          </label>
        </div>
      </div>

      <Select value={selectedBucket} onValueChange={setSelectedBucket}>
        <SelectTrigger className="w-[250px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          {BUCKETS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
        </SelectContent>
      </Select>

      <div className="text-xs text-muted-foreground">{files.length} files in "{selectedBucket}"</div>

      {isLoading ? (
        <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" /></div>
      ) : files.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No files in this bucket</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {files.map((file) => (
            <Card key={file.id || file.name}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  {isImage(file.metadata?.mimetype) ? <Image className="w-5 h-5 text-primary" /> : <File className="w-5 h-5 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-[10px] text-muted-foreground">{formatSize(file.metadata?.size)} · {new Date(file.created_at).toLocaleDateString()}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(file.name)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminFileManager;

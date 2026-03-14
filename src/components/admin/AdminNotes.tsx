import { useState, useEffect } from "react";
import { StickyNote, Plus, Trash2, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/services/database";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  color: string;
}

const COLORS = ["bg-yellow-500/10", "bg-blue-500/10", "bg-green-500/10", "bg-pink-500/10", "bg-purple-500/10"];

const AdminNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  // Store notes in localStorage for now (can be migrated to DB later)
  useEffect(() => {
    const stored = localStorage.getItem(`admin_notes_${user?.id}`);
    if (stored) setNotes(JSON.parse(stored));
  }, [user?.id]);

  const saveNotes = (updatedNotes: Note[]) => {
    setNotes(updatedNotes);
    localStorage.setItem(`admin_notes_${user?.id}`, JSON.stringify(updatedNotes));
  };

  const addNote = () => {
    if (!newTitle.trim()) return;
    const note: Note = {
      id: crypto.randomUUID(),
      title: newTitle,
      content: newContent,
      created_at: new Date().toISOString(),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
    saveNotes([note, ...notes]);
    setNewTitle("");
    setNewContent("");
    toast({ title: "Note added" });
  };

  const deleteNote = (id: string) => {
    saveNotes(notes.filter(n => n.id !== id));
    toast({ title: "Note deleted" });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground font-display">Admin Notes</h2>
        <p className="text-muted-foreground text-sm mt-1">Quick notes and reminders for the admin team.</p>
      </div>

      {/* Add Note */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <Input placeholder="Note title..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
          <Textarea placeholder="Write your note..." value={newContent} onChange={(e) => setNewContent(e.target.value)} rows={3} />
          <Button size="sm" onClick={addNote} disabled={!newTitle.trim()}>
            <Plus className="w-4 h-4 mr-1" /> Add Note
          </Button>
        </CardContent>
      </Card>

      {/* Notes Grid */}
      {notes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <StickyNote className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No notes yet. Add your first note above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {notes.map((note) => (
            <Card key={note.id} className={`${note.color} border-0`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-semibold text-foreground">{note.title}</h3>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => deleteNote(note.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{note.content}</p>
                <p className="text-[10px] text-muted-foreground mt-3">{new Date(note.created_at).toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminNotes;

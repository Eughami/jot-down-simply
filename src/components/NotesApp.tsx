import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar, Note } from "./AppSidebar";
import { NoteEditor } from "./NoteEditor";
import { Menu } from "lucide-react";

export function NotesApp() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  // Load notes from localStorage on mount
  useEffect(() => {
    const savedNotes = localStorage.getItem('notes');
    if (savedNotes) {
      const parsedNotes = JSON.parse(savedNotes).map((note: any) => ({
        ...note,
        lastModified: new Date(note.lastModified)
      }));
      setNotes(parsedNotes);
      if (parsedNotes.length > 0) {
        setActiveNoteId(parsedNotes[0].id);
      }
    } else {
      // Create a welcome note
      const welcomeNote: Note = {
        id: 'welcome',
        title: 'Welcome to Notes',
        content: '<p>Welcome to your minimalist note-taking app!</p><p>Start by clicking the <strong>+</strong> button to create a new note, or edit this one.</p><p>Use the formatting toolbar to make your text <strong>bold</strong>, <em>italic</em>, or <u>underlined</u>.</p>',
        lastModified: new Date()
      };
      setNotes([welcomeNote]);
      setActiveNoteId(welcomeNote.id);
    }
  }, []);

  // Save notes to localStorage whenever notes change
  useEffect(() => {
    if (notes.length > 0) {
      localStorage.setItem('notes', JSON.stringify(notes));
    }
  }, [notes]);

  const activeNote = notes.find(note => note.id === activeNoteId);

  const handleNewNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: '',
      content: '',
      lastModified: new Date()
    };
    setNotes(prev => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
  };

  const handleNoteSelect = (noteId: string) => {
    setActiveNoteId(noteId);
  };

  const handleTitleChange = (title: string) => {
    if (!activeNoteId) return;
    
    setNotes(prev => prev.map(note => 
      note.id === activeNoteId 
        ? { ...note, title, lastModified: new Date() }
        : note
    ));
  };

  const handleContentChange = (content: string) => {
    if (!activeNoteId) return;
    
    setNotes(prev => prev.map(note => 
      note.id === activeNoteId 
        ? { ...note, content, lastModified: new Date() }
        : note
    ));
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar
          notes={notes}
          activeNoteId={activeNoteId}
          onNoteSelect={handleNoteSelect}
          onNewNote={handleNewNote}
        />
        
        <main className="flex-1 flex flex-col">
          {/* Header with sidebar trigger */}
          <header className="h-12 flex items-center border-b border-border bg-background">
            <SidebarTrigger className="ml-4">
              <Menu className="h-4 w-4" />
            </SidebarTrigger>
          </header>

          {/* Editor area */}
          <div className="flex-1">
            {activeNote ? (
              <NoteEditor
                title={activeNote.title}
                content={activeNote.content}
                onTitleChange={handleTitleChange}
                onContentChange={handleContentChange}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <p className="text-lg mb-2">No note selected</p>
                  <p className="text-sm">Create a new note to get started</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
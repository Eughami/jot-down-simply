import { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar, Note } from './AppSidebar';
import { NoteEditor } from './NoteEditor';
import { Input } from '@/components/ui/input';
import { Loader2, Menu } from 'lucide-react';
import { getNotes, mergeNotes } from '@/api';

export function NotesApp() {
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  // Load notes from localStorage on mount
  useEffect(() => {
    async function initialLoad(): Promise<void> {
      try {
        const notes = await getNotes();
        const allNotes = await mergeNotes(notes);
        console.log(allNotes);
        if (allNotes.length > 0) {
          setNotes(allNotes);
          setActiveNoteId(allNotes[0].id);
        } else {
          const welcomeNote: Note = {
            id: Date.now().toString(),
            title: 'Welcome to Notes',
            content:
              '<p>Welcome to your minimalist note-taking app!</p><p>Start by clicking the <strong>+</strong> button to create a new note, or edit this one.</p><p>Use the formatting toolbar to make your text <strong>bold</strong>, <em>italic</em>, or <u>underlined</u>.</p>',
            updated_at: new Date(),
          };
          setNotes([welcomeNote]);
          setActiveNoteId(welcomeNote.id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        console.log('Merge done');
        setLoading(false);
      }
    }

    initialLoad();
  }, []);

  // Save notes to localStorage whenever notes change
  useEffect(() => {
    if (notes.length > 0) {
      localStorage.setItem('notes', JSON.stringify(notes));
    }
  }, [notes]);

  const activeNote = notes.find((note) => note.id === activeNoteId);

  const handleNewNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: '',
      content: '',
      updated_at: new Date(),
    };
    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
  };

  const handleNoteSelect = (noteId: string) => {
    setActiveNoteId(noteId);
  };

  const handleTitleChange = (title: string) => {
    if (!activeNoteId) return;

    setNotes((prev) =>
      prev.map((note) =>
        note.id === activeNoteId
          ? { ...note, title, updated_at: new Date() }
          : note
      )
    );
  };

  const handleContentChange = (content: string) => {
    if (!activeNoteId) return;

    setNotes((prev) =>
      prev.map((note) =>
        note.id === activeNoteId
          ? { ...note, content, updated_at: new Date() }
          : note
      )
    );
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {loading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Loader2 className="h-12 w-12 animate-spin text-white" />
          </div>
        )}

        <AppSidebar
          notes={notes}
          activeNoteId={activeNoteId}
          onNoteSelect={handleNoteSelect}
          onNewNote={handleNewNote}
        />

        <main className="flex-1 flex flex-col min-w-0">
          {/* Header with sidebar trigger and title */}
          <header className="h-12 flex items-center border-b border-border bg-background px-4 gap-4">
            <SidebarTrigger />
            {activeNote && (
              <Input
                value={activeNote.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Note title..."
                className="text-lg font-semibold border-none bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1"
              />
            )}
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

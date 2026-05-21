import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar, Note, SortOption } from './AppSidebar';
import { NoteEditor } from './NoteEditor';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import {
  getNotes,
  mergeNotes,
  noteChangedAt,
  saveLocalNotes,
  syncNote,
} from '@/api';

const SORT_STORAGE_KEY = 'notesSortOption';

function sortVisibleNotes(notes: Note[], sortOption: SortOption): Note[] {
  const visibleNotes = notes.filter((note) => !note.deleted_at);

  return [...visibleNotes].sort((a, b) => {
    if (sortOption === 'updated-asc') {
      return noteChangedAt(a) - noteChangedAt(b);
    }

    if (sortOption === 'title-asc') {
      const aTitle = a.title.trim() || 'Untitled';
      const bTitle = b.title.trim() || 'Untitled';
      return aTitle.localeCompare(bTitle);
    }

    return noteChangedAt(b) - noteChangedAt(a);
  });
}

function createDraftNote(overrides: Partial<Note> = {}): Note {
  const now = new Date();

  return {
    id: Date.now().toString(),
    title: '',
    content: '',
    created_at: now,
    updated_at: now,
    deleted_at: null,
    ...overrides,
  };
}

export function NotesApp() {
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>(() => {
    return (
      (localStorage.getItem(SORT_STORAGE_KEY) as SortOption | null) ||
      'updated-desc'
    );
  });
  const syncTimersRef = useRef<Record<string, number>>({});
  const initialSortOptionRef = useRef(sortOption);

  const queueNoteSync = useCallback((note: Note, delay = 700) => {
    window.clearTimeout(syncTimersRef.current[note.id]);

    syncTimersRef.current[note.id] = window.setTimeout(async () => {
      try {
        const syncedNote = await syncNote(note);

        setNotes((prev) =>
          prev.map((currentNote) => {
            if (currentNote.id !== syncedNote.id) return currentNote;
            return noteChangedAt(syncedNote) >= noteChangedAt(currentNote)
              ? syncedNote
              : currentNote;
          })
        );
      } catch (error) {
        console.error(error);
      } finally {
        delete syncTimersRef.current[note.id];
      }
    }, delay);
  }, []);

  // Load notes from localStorage on mount
  useEffect(() => {
    async function initialLoad(): Promise<void> {
      try {
        let remoteNotes: Note[] = [];

        try {
          remoteNotes = await getNotes(true);
        } catch (error) {
          console.error(error);
        }

        const allNotes = await mergeNotes(remoteNotes);
        const visibleNotes = sortVisibleNotes(
          allNotes,
          initialSortOptionRef.current
        );

        if (visibleNotes.length > 0) {
          setNotes(allNotes);
          setActiveNoteId(visibleNotes[0].id);
        } else {
          const welcomeNote = createDraftNote({
            title: 'Welcome to Notes',
            content:
              '<p>Welcome to your minimalist note-taking app!</p><p>Start by clicking the <strong>+</strong> button to create a new note, or edit this one.</p><p>Use the formatting toolbar to make your text <strong>bold</strong>, <em>italic</em>, or <u>underlined</u>.</p>',
          });

          setNotes([welcomeNote]);
          setActiveNoteId(welcomeNote.id);
          queueNoteSync(welcomeNote, 0);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    initialLoad();
  }, [queueNoteSync]);

  // Save notes to localStorage whenever notes change
  useEffect(() => {
    if (!loading) {
      saveLocalNotes(notes);
    }
  }, [loading, notes]);

  useEffect(() => {
    localStorage.setItem(SORT_STORAGE_KEY, sortOption);
  }, [sortOption]);

  useEffect(() => {
    const syncTimers = syncTimersRef.current;

    return () => {
      Object.values(syncTimers).forEach((timerId) => {
        window.clearTimeout(timerId);
      });
    };
  }, []);

  const visibleNotes = useMemo(
    () => sortVisibleNotes(notes, sortOption),
    [notes, sortOption]
  );

  const activeNote = notes.find(
    (note) => note.id === activeNoteId && !note.deleted_at
  );

  const handleNewNote = () => {
    const newNote = createDraftNote();

    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    queueNoteSync(newNote, 0);
  };

  const handleNoteSelect = (noteId: string) => {
    setActiveNoteId(noteId);
  };

  const handleTitleChange = (title: string) => {
    if (!activeNoteId) return;

    const activeNote = notes.find((note) => note.id === activeNoteId);
    if (!activeNote) return;

    const updatedNote = { ...activeNote, title, updated_at: new Date() };

    setNotes((prev) =>
      prev.map((note) =>
        note.id === activeNoteId ? updatedNote : note
      )
    );
    queueNoteSync(updatedNote);
  };

  const handleContentChange = (content: string) => {
    if (!activeNoteId) return;

    const activeNote = notes.find((note) => note.id === activeNoteId);
    if (!activeNote) return;

    const updatedNote = { ...activeNote, content, updated_at: new Date() };

    setNotes((prev) =>
      prev.map((note) =>
        note.id === activeNoteId ? updatedNote : note
      )
    );
    queueNoteSync(updatedNote);
  };

  const handleDeleteNote = (noteId: string) => {
    const noteToDelete = notes.find((note) => note.id === noteId);
    if (!noteToDelete) return;

    const deletedAt = new Date();
    const deletedNote = {
      ...noteToDelete,
      updated_at: deletedAt,
      deleted_at: deletedAt,
    };
    const nextNotes = notes.map((note) =>
      note.id === noteId ? deletedNote : note
    );

    setNotes(nextNotes);
    queueNoteSync(deletedNote, 0);

    if (activeNoteId === noteId) {
      const nextActiveNote = sortVisibleNotes(nextNotes, sortOption)[0];
      setActiveNoteId(nextActiveNote?.id || null);
    }
  };

  const handleSortOptionChange = (nextSortOption: SortOption) => {
    setSortOption(nextSortOption);
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
          notes={visibleNotes}
          activeNoteId={activeNoteId}
          sortOption={sortOption}
          onNoteSelect={handleNoteSelect}
          onNewNote={handleNewNote}
          onDeleteNote={handleDeleteNote}
          onSortOptionChange={handleSortOptionChange}
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

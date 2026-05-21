import axios, { AxiosError } from 'axios';
import type { Note } from './components/AppSidebar';

// const API_URL = 'https://notes-api.eughami.com';
const API_URL = 'http://localhost:3000';
const NOTES_STORAGE_KEY = 'notes';

interface User {
  id: number;
  username: string;
  password: string;
}

const authHeaders = () => ({ 'x-user-id': localStorage.getItem('userId') });

const serializeNote = (note: Note) => ({
  ...note,
  created_at: note.created_at?.toISOString() || note.updated_at.toISOString(),
  updated_at: note.updated_at.toISOString(),
  deleted_at: note.deleted_at ? note.deleted_at.toISOString() : null,
});

export function normalizeNote(note: Partial<Note>): Note {
  const updatedAt = new Date(note.updated_at || Date.now());
  const createdAt = new Date(note.created_at || updatedAt);

  return {
    id: String(note.id),
    title: note.title || '',
    content: note.content || '',
    created_at: createdAt,
    updated_at: updatedAt,
    deleted_at: note.deleted_at ? new Date(note.deleted_at) : null,
    is_hidden: Boolean(note.is_hidden),
  };
}

export function readLocalNotes(): Note[] {
  const savedNotes = localStorage.getItem(NOTES_STORAGE_KEY);
  if (!savedNotes) return [];

  try {
    const notes = JSON.parse(savedNotes);
    if (!Array.isArray(notes)) return [];
    return notes.map(normalizeNote);
  } catch (error) {
    console.error(error);
    return [];
  }
}

export function saveLocalNotes(notes: Note[]): void {
  localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
}

export function noteChangedAt(note: Note): number {
  return (note.deleted_at || note.updated_at).getTime();
}

export async function createUser(username: string): Promise<User> {
  const res = await axios.post(`${API_URL}/users`, { username });
  return res.data;
}

export async function getNotes(includeDeleted = false): Promise<Note[]> {
  const res = await axios.get(`${API_URL}/notes`, {
    headers: authHeaders(),
    params: { includeDeleted },
  });
  return res.data.map(normalizeNote);
}

export async function updateNote(
  id: string,
  key: string,
  value: string,
  payload?: Partial<Note>
): Promise<Note | undefined> {
  try {
    const res = await axios.patch(
      `${API_URL}/notes/${id}`,
      payload || { [key]: value },
      { headers: authHeaders() }
    );
    return normalizeNote(res.data);
  } catch (error) {
    console.error(error);
  }
}

export async function syncNote(note: Note): Promise<Note> {
  if (note.deleted_at) {
    return deleteNote(note.id, note.deleted_at);
  }

  const res = await axios.post(`${API_URL}/notes`, serializeNote(note), {
    headers: authHeaders(),
  });
  return normalizeNote(res.data);
}

export async function createNote(note: Note): Promise<Note> {
  return syncNote(note);
}

export async function deleteNote(
  id: string,
  deletedAt = new Date()
): Promise<Note> {
  try {
    const res = await axios.delete(`${API_URL}/notes/${id}`, {
      headers: authHeaders(),
      data: { deleted_at: deletedAt.toISOString() },
    });
    return normalizeNote(res.data);
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 404) {
      return normalizeNote({
        id,
        title: '',
        content: '',
        updated_at: deletedAt,
        deleted_at: deletedAt,
      });
    }
    throw error;
  }
}

export async function deleteNode(id: string): Promise<void> {
  await deleteNote(id);
}

export async function mergeNotes(remoteNotes: Note[] = []): Promise<Note[]> {
  const localNotes = readLocalNotes();

  if (!remoteNotes.length && !localNotes.length) return [];

  const mergedNotes = new Map<string, Note>();

  remoteNotes.map(normalizeNote).forEach((note) => {
    mergedNotes.set(note.id, note);
  });

  const syncTasks: Promise<Note>[] = [];

  localNotes.forEach((localNote) => {
    const remoteNote = mergedNotes.get(localNote.id);

    if (!remoteNote) {
      mergedNotes.set(localNote.id, localNote);
      syncTasks.push(syncNote(localNote));
      return;
    }

    if (noteChangedAt(localNote) > noteChangedAt(remoteNote)) {
      mergedNotes.set(localNote.id, localNote);
      syncTasks.push(syncNote(localNote));
    }
  });

  if (syncTasks.length) {
    const syncedNotes = await Promise.allSettled(syncTasks);
    syncedNotes.forEach((result) => {
      if (result.status === 'fulfilled') {
        mergedNotes.set(result.value.id, result.value);
      } else {
        console.error(result.reason);
      }
    });
  }

  const notes = Array.from(mergedNotes.values());
  saveLocalNotes(notes);
  return notes;
}

import axios from 'axios';
import { Note } from './components/AppSidebar';
const API_URL = 'https://notes-api.eughami.com';

interface User {
  id: number;
  username: string;
  password: string;
}

export async function createUser(username: string): Promise<User> {
  const res = await axios.post(`${API_URL}/users`, { username });
  return res.data;
}

export async function getNotes(): Promise<Note[]> {
  const res = await axios.get(`${API_URL}/notes`, {
    headers: { 'x-user-id': localStorage.getItem('userId') },
  });
  return res.data;
}

export async function updateNote(
  id: string,
  key: string,
  value: string,
  payload: { [key: string]: string }
): Promise<void> {
  try {
    await axios.patch(
      `${API_URL}/notes/${id}`,
      payload
        ? {
            ...payload,
          }
        : { [key]: value },
      { headers: { 'x-user-id': localStorage.getItem('userId') } }
    );
  } catch (error) {
    console.error(error);
  }
}

export async function createNote(n: Note): Promise<Note> {
  try {
    const res = await axios.post(
      `${API_URL}/notes`,
      {
        ...n,
        createdAt: n.updated_at,
      },
      {
        headers: { 'x-user-id': localStorage.getItem('userId') },
      }
    );
    return res.data;
  } catch (error) {
    console.error(error);
  }
}

export async function deleteNode(id: string): Promise<void> {
  await axios.delete(`${API_URL}/notes/${id}`);
}

type noteObj = {
  [key: string]: Note;
};
export async function mergeNotes(notes: Note[] = []): Promise<Note[]> {
  const savedNotes = localStorage.getItem('notes');
  let localNotes: Note[] = [];
  if (savedNotes) {
    localNotes = JSON.parse(savedNotes).map((note: Note) => ({
      ...note,
      id: parseInt(note.id, 10),
      updated_at: new Date(note.updated_at),
    }));
  }

  if (!notes.length && !localNotes.length) return [];

  const uniqueNote: noteObj = {};

  notes.forEach((n) => {
    uniqueNote[n.id] = {
      id: n.id,
      title: n.title,
      content: n.content,
      updated_at: new Date(n.updated_at),
      is_hidden: n.is_hidden,
    };
  });

  localNotes.forEach((n) => {
    if (uniqueNote[n.id]) {
      // note exist remotely
      const localIsNewer = isNewer(
        new Date(n.updated_at),
        uniqueNote[n.id].updated_at
      );
      //* 1. remote is more recent: overwrite local <<DO NOTHING!!>>
      //* 2. local is more recent: overwrite remote
      if (localIsNewer) {
        uniqueNote[n.id] = {
          ...n,
          updated_at: new Date(n.updated_at),
        };

        updateNote(n.id, '', '', {
          title: n.title,
          content: n.content,
        });
      }
      //! For future find a merge strategy
      //! <<<<<MAYBE FIND A WAY TO SAVE PREVIOUS CONTENT OF NOTE IN A HISTORY TABLE>>>>>>>>>
    } else {
      uniqueNote[n.id] = {
        ...n,
        updated_at: new Date(n.updated_at),
      };
      createNote(n);
    }
  });

  return Object.values(uniqueNote);
}

function isNewer(d1: Date, d2: Date): boolean {
  return d1.getTime() > d2.getTime();
}

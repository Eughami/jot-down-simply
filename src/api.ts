import axios from 'axios';
const API_URL = 'http://localhost:3000';

interface User {
  id: number;
  username: string;
  password: string;
}

interface Note {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  deleted_at: string;
  is_hidden: boolean;
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

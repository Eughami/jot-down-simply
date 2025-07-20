import { createUser } from '@/api';
import { NotesApp } from '@/components/NotesApp';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

const Index = () => {
  const [userId, setUserId] = useState(localStorage.getItem('userId'));
  const [inputValue, setInputValue] = useState('');

  const handleSave = async (value: string) => {
    console.log('Saved value:', value);
    try {
      const user = await createUser(value);
      if (user.id) {
        localStorage.setItem('userId', user.id.toString());
        setUserId(user.id.toString());
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (!userId)
    return (
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle className="text-lg font-semibold">
            Enter a Username
          </DialogTitle>
          <Input
            minLength={3}
            placeholder="username..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <DialogFooter>
            <Button
              onClick={() => handleSave(inputValue)}
              disabled={inputValue.length < 3}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  return <NotesApp />;
};

export default Index;

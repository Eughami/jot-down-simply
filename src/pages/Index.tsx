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
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

const Index = () => {
  const [userId, setUserId] = useState(localStorage.getItem('userId'));
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async (value: string) => {
    setIsLoading(true);

    try {
      const user = await createUser(value);
      if (user.id) {
        localStorage.setItem('userId', user.id.toString());
        setUserId(user.id.toString());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
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
              disabled={inputValue.length < 3 || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  return <NotesApp />;
};

export default Index;

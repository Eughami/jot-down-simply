import { useState } from 'react';
import { Plus, FileText, Search, Trash2 } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenuAction,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type SortOption = 'updated-desc' | 'updated-asc' | 'title-asc';

export interface Note {
  id: string;
  title: string;
  content: string;
  created_at?: Date;
  updated_at: Date;
  deleted_at?: Date | null;
  is_hidden?: boolean;
}

interface AppSidebarProps {
  notes: Note[];
  activeNoteId: string | null;
  sortOption: SortOption;
  onNoteSelect: (noteId: string) => void;
  onNewNote: () => void;
  onDeleteNote: (noteId: string) => void;
  onSortOptionChange: (sortOption: SortOption) => void;
}

export function AppSidebar({
  notes,
  activeNoteId,
  sortOption,
  onNoteSelect,
  onNewNote,
  onDeleteNote,
  onSortOptionChange,
}: AppSidebarProps) {
  const { state } = useSidebar();
  const [searchQuery, setSearchQuery] = useState('');
  const isCollapsed = state === 'collapsed';

  const filteredNotes = notes.filter((note) => {
    if (note.deleted_at) return false;

    const normalizedQuery = searchQuery.toLowerCase();
    return (
      note.title.toLowerCase().includes(normalizedQuery) ||
      note.content.toLowerCase().includes(normalizedQuery)
    );
  });

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  function getTextPreview(html: string, maxLength = 100): string {
    // Create a dummy element to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Get text content only
    let text = tempDiv.textContent || tempDiv.innerText || '';

    // Trim and normalize whitespace
    text = text.replace(/\s+/g, ' ').trim();

    // Truncate to maxLength
    if (text.length > maxLength) {
      text = text.slice(0, maxLength).trim() + '...';
    }

    return text;
  }

  return (
    <Sidebar variant="sidebar" className="border-r border-border">
      <SidebarHeader className="p-4 border-b border-border">
        {!isCollapsed && (
          <>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-foreground">Notes</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={onNewNote}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Select
              value={sortOption}
              onValueChange={(value) =>
                onSortOptionChange(value as SortOption)
              }
            >
              <SelectTrigger className="mt-3 h-8 text-xs">
                <SelectValue placeholder="Sort notes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated-desc">Last modified</SelectItem>
                <SelectItem value="updated-asc">Oldest modified</SelectItem>
                <SelectItem value="title-asc">Title A-Z</SelectItem>
              </SelectContent>
            </Select>
          </>
        )}
        {isCollapsed && (
          <Button
            variant="outline"
            size="sm"
            onClick={onNewNote}
            className="h-8 w-8 p-0 mx-auto"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </SidebarHeader>

      <SidebarContent>
        <ScrollArea className="flex-1">
          <SidebarMenu className="p-2">
            {filteredNotes.map((note) => (
              <SidebarMenuItem key={note.id}>
                <SidebarMenuButton
                  asChild
                  isActive={note.id === activeNoteId}
                  className={`
                    h-auto p-3 rounded-lg cursor-pointer transition-colors
                    ${
                      note.id === activeNoteId
                        ? 'bg-note-active text-note-active-foreground'
                        : 'hover:bg-note-hover'
                    }
                  `}
                >
                  <div onClick={() => onNoteSelect(note.id)} className="w-full">
                    {!isCollapsed ? (
                      <div className="flex flex-col items-start space-y-1">
                        <div className="flex items-center space-x-2 w-full">
                          <FileText className="h-4 w-4 text-current flex-shrink-0" />
                          <span className="font-medium text-sm truncate">
                            {getTextPreview(note.title, 20) || 'Untitled'}
                          </span>
                        </div>
                        <p className="text-xs text-current/70 line-clamp-2 text-left">
                          {getTextPreview(note.content)}
                        </p>
                        <span className="text-xs text-current/50">
                          {formatDate(note.updated_at)}
                        </span>
                      </div>
                    ) : (
                      <FileText className="h-4 w-4 mx-auto" />
                    )}
                  </div>
                </SidebarMenuButton>
                {!isCollapsed && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <SidebarMenuAction
                        showOnHover
                        aria-label="Delete note"
                        onClick={(event) => event.stopPropagation()}
                        className="text-current/70 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </SidebarMenuAction>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete note?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This note will be removed from the sidebar and kept as
                          a soft-deleted record for sync.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDeleteNote(note.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  );
}

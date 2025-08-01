import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Strikethrough,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface FormatToolbarProps {
  onFormat: (command: string, value?: string) => void;
}

export function FormatToolbar({ onFormat }: FormatToolbarProps) {
  const formatButtons = [
    { command: 'bold', icon: Bold, label: 'Bold' },
    { command: 'italic', icon: Italic, label: 'Italic' },
    { command: 'underline', icon: Underline, label: 'Underline' },
    { command: 'strikethrough', icon: Strikethrough, label: 'Strikethrough' },
  ];

  const listButtons = [
    { command: 'insertUnorderedList', icon: List, label: 'Bullet List' },
    { command: 'insertOrderedList', icon: ListOrdered, label: 'Numbered List' },
  ];

  return (
    <div className="flex items-center space-x-1 p-3 bg-toolbar border-b border-border">
      {/* Text formatting */}
      <div className="flex items-center space-x-1">
        {formatButtons.map(({ command, icon: Icon, label }) => (
          <Button
            key={command}
            variant="ghost"
            size="sm"
            onClick={() => onFormat(command)}
            className="h-8 w-8 p-0"
            title={label}
          >
            <Icon className="h-4 w-4" />
          </Button>
        ))}
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Lists */}
      <div className="flex items-center space-x-1">
        {listButtons.map(({ command, icon: Icon, label }) => (
          <Button
            key={command}
            variant="ghost"
            size="sm"
            onClick={() => onFormat(command)}
            className="h-8 w-8 p-0"
            title={label}
          >
            <Icon className="h-4 w-4" />
          </Button>
        ))}
      </div>
    </div>
  );
}

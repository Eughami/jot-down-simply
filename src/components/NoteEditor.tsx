import { useRef, useEffect, useCallback } from "react";
import { FormatToolbar } from "./FormatToolbar";
import { Input } from "@/components/ui/input";

interface NoteEditorProps {
  title: string;
  content: string;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
}

export function NoteEditor({ title, content, onTitleChange, onContentChange }: NoteEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Update editor content when content prop changes
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  const handleFormat = useCallback((command: string, value?: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false, value);
    }
  }, []);

  const handleContentChange = useCallback(() => {
    if (editorRef.current) {
      onContentChange(editorRef.current.innerHTML);
    }
  }, [onContentChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          handleFormat('bold');
          break;
        case 'i':
          e.preventDefault();
          handleFormat('italic');
          break;
        case 'u':
          e.preventDefault();
          handleFormat('underline');
          break;
      }
    }
  }, [handleFormat]);

  return (
    <div className="flex flex-col h-full bg-editor">
      {/* Formatting toolbar */}
      <FormatToolbar onFormat={handleFormat} />

      {/* Editor */}
      <div className="flex-1 p-6">
        <div
          ref={editorRef}
          contentEditable
          className="min-h-full w-full outline-none text-editor-foreground leading-relaxed"
          style={{
            fontSize: '16px',
            lineHeight: '1.6',
          }}
          onInput={handleContentChange}
          onKeyDown={handleKeyDown}
          data-placeholder="Start writing your note..."
        />
      </div>

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: hsl(var(--muted-foreground));
        }
        
        [contenteditable] {
          min-height: 300px;
        }
        
        [contenteditable] h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 0.67em 0;
        }
        
        [contenteditable] h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.75em 0;
        }
        
        [contenteditable] h3 {
          font-size: 1.17em;
          font-weight: bold;
          margin: 0.83em 0;
        }
        
        [contenteditable] p {
          margin: 1em 0;
        }
        
        [contenteditable] ul, [contenteditable] ol {
          margin: 1em 0;
          padding-left: 2em;
        }
        
        [contenteditable] li {
          margin: 0.5em 0;
        }
      `}</style>
    </div>
  );
}
import { useEffect } from 'react';
import './TerminalContextMenu.css';

interface TerminalContextMenuProps {
  x: number;
  y: number;
  onCopy: () => void;
  onPaste: () => void;
  onClose: () => void;
  hasSelection: boolean;
}

export function TerminalContextMenu({
  x,
  y,
  onCopy,
  onPaste,
  onClose,
  hasSelection,
}: TerminalContextMenuProps) {
  useEffect(() => {
    const handleClickOutside = () => onClose();
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    // Delay adding click listener to avoid immediate close
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);
    document.addEventListener('keydown', handleEscape);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div
      className="terminal-context-menu"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="context-menu-item"
        onClick={() => {
          onCopy();
          onClose();
        }}
        disabled={!hasSelection}
      >
        <span>Copy</span>
        <span className="shortcut">Ctrl+Shift+C</span>
      </button>
      <button
        className="context-menu-item"
        onClick={() => {
          onPaste();
          onClose();
        }}
      >
        <span>Paste</span>
        <span className="shortcut">Ctrl+Shift+V</span>
      </button>
    </div>
  );
}

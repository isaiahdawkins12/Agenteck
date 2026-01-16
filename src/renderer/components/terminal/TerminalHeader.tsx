import { useTerminalStore } from '../../store/terminalStore';
import { useLayoutStore } from '../../store/layoutStore';
import './TerminalHeader.css';

interface TerminalHeaderProps {
  terminalId: string;
}

export function TerminalHeader({ terminalId }: TerminalHeaderProps) {
  const { terminals, killTerminal, setActiveTerminal } = useTerminalStore();
  const { removeTile } = useLayoutStore();
  const terminal = terminals[terminalId];

  if (!terminal) return null;

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    killTerminal(terminalId);
    removeTile(terminalId);
  };

  const handleClick = () => {
    setActiveTerminal(terminalId);
  };

  const getStatusColor = () => {
    switch (terminal.status) {
      case 'running':
        return 'var(--color-success)';
      case 'exited':
        return 'var(--color-warning)';
      case 'error':
        return 'var(--color-error)';
      default:
        return 'var(--color-textMuted)';
    }
  };

  return (
    <div className="terminal-header" onClick={handleClick}>
      <div className="terminal-header-left">
        <span
          className="terminal-status"
          style={{ backgroundColor: getStatusColor() }}
          title={terminal.status}
        />
        <span className="terminal-title">{terminal.title}</span>
        {terminal.status === 'exited' && terminal.exitCode !== undefined && (
          <span className="terminal-exit-code">
            (exit: {terminal.exitCode})
          </span>
        )}
      </div>

      <div className="terminal-header-actions">
        <button
          className="terminal-action-button"
          onClick={handleClose}
          title="Close terminal"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path
              fill="currentColor"
              d="M1.41 0L0 1.41l4.59 4.59L0 10.59 1.41 12l4.59-4.59L10.59 12 12 10.59 7.41 6 12 1.41 10.59 0 6 4.59 1.41 0z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

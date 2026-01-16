import { useTerminalStore } from '../../store/terminalStore';
import { useLayoutStore } from '../../store/layoutStore';
import './TerminalList.css';

export function TerminalList() {
  const { terminals, activeTerminalId, setActiveTerminal, killTerminal } = useTerminalStore();
  const { removeTile } = useLayoutStore();

  const terminalList = Object.values(terminals);

  const handleSelectTerminal = (id: string) => {
    setActiveTerminal(id);
  };

  const handleCloseTerminal = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await killTerminal(id);
    removeTile(id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
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

  if (terminalList.length === 0) {
    return (
      <div className="terminal-list">
        <div className="terminal-list-header">
          <h3>Open Terminals</h3>
        </div>
        <div className="terminal-list-empty">
          <p>No terminals open</p>
        </div>
      </div>
    );
  }

  return (
    <div className="terminal-list">
      <div className="terminal-list-header">
        <h3>Open Terminals</h3>
        <span className="terminal-count-badge">{terminalList.length}</span>
      </div>
      <div className="terminal-list-items">
        {terminalList.map((terminal) => (
          <button
            key={terminal.id}
            className={`terminal-list-item ${activeTerminalId === terminal.id ? 'active' : ''}`}
            onClick={() => handleSelectTerminal(terminal.id)}
          >
            <span
              className="terminal-status-dot"
              style={{ backgroundColor: getStatusColor(terminal.status) }}
            />
            <div className="terminal-list-info">
              <span className="terminal-list-title">{terminal.title}</span>
              <span className="terminal-list-cwd">{terminal.cwd}</span>
            </div>
            <button
              className="terminal-list-close"
              onClick={(e) => handleCloseTerminal(e, terminal.id)}
              title="Close terminal"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <path d="M3.05 3.05a.5.5 0 01.707 0L6 5.293l2.243-2.243a.5.5 0 01.707.707L6.707 6l2.243 2.243a.5.5 0 01-.707.707L6 6.707 3.757 8.95a.5.5 0 01-.707-.707L5.293 6 3.05 3.757a.5.5 0 010-.707z" />
              </svg>
            </button>
          </button>
        ))}
      </div>
    </div>
  );
}

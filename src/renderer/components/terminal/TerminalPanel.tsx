import { TerminalView } from './TerminalView';
import { useTerminalStore } from '../../store/terminalStore';
import './TerminalPanel.css';

interface TerminalPanelProps {
  terminalId: string;
}

export function TerminalPanel({ terminalId }: TerminalPanelProps) {
  const { terminals, activeTerminalId, setActiveTerminal } = useTerminalStore();
  const terminal = terminals[terminalId];
  const isActive = activeTerminalId === terminalId;

  if (!terminal) {
    return (
      <div className="terminal-panel terminal-panel-empty">
        <p>Terminal not found</p>
      </div>
    );
  }

  const handleClick = () => {
    setActiveTerminal(terminalId);
  };

  return (
    <div
      className={`terminal-panel ${isActive ? 'terminal-panel-active' : ''}`}
      onClick={handleClick}
    >
      <TerminalView terminalId={terminalId} />
    </div>
  );
}

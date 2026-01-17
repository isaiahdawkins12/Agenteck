import { Mosaic, MosaicWindow, MosaicNode, MosaicBranch } from 'react-mosaic-component';
import { TerminalPanel } from '../terminal/TerminalPanel';
import { useLayoutStore } from '../../store/layoutStore';
import { useTerminalStore } from '../../store/terminalStore';
import 'react-mosaic-component/react-mosaic-component.css';
import './TileContainer.css';


function TerminalToolbar({ terminalId }: { terminalId: string }) {
  const { terminals, killTerminal } = useTerminalStore();
  const { removeTile } = useLayoutStore();
  const terminal = terminals[terminalId];

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    killTerminal(terminalId);
    removeTile(terminalId);
  };

  const getStatusColor = () => {
    switch (terminal?.status) {
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
    <div className="mosaic-window-toolbar">
      <div className="mosaic-window-title">
        <span className="drag-handle-icon" title="Drag to rearrange">
          <svg width="8" height="12" viewBox="0 0 10 14" fill="currentColor" opacity="0.5">
            <circle cx="2" cy="2" r="1.5" />
            <circle cx="8" cy="2" r="1.5" />
            <circle cx="2" cy="7" r="1.5" />
            <circle cx="8" cy="7" r="1.5" />
            <circle cx="2" cy="12" r="1.5" />
            <circle cx="8" cy="12" r="1.5" />
          </svg>
        </span>
        <span
          className="terminal-status-dot"
          style={{ backgroundColor: getStatusColor() }}
          title={terminal?.status || 'unknown'}
        />
        <span>{terminal?.title || 'Terminal'}</span>
        {terminal?.status === 'exited' && terminal.exitCode !== undefined && (
          <span className="terminal-exit-code">(exit: {terminal.exitCode})</span>
        )}
      </div>
      <div className="mosaic-window-controls">
        <button
          className="terminal-toolbar-button"
          onClick={handleClose}
          title="Close terminal"
        >
          <svg width="10" height="10" viewBox="0 0 12 12">
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

export function TileContainer() {
  const { layout, setLayout } = useLayoutStore();
  const { terminals, setActiveTerminal } = useTerminalStore();

  const handleLayoutChange = (newLayout: MosaicNode<string> | null) => {
    setLayout(newLayout);
  };

  const renderTile = (id: string, path: MosaicBranch[]) => {
    const terminal = terminals[id];

    if (!terminal) {
      return (
        <MosaicWindow<string>
          path={path}
          title="Terminal not found"
          toolbarControls={null}
          createNode={() => id}
        >
          <div className="tile-empty">
            <p>Terminal not found</p>
          </div>
        </MosaicWindow>
      );
    }

    return (
      <MosaicWindow<string>
        path={path}
        title={terminal.title}
        createNode={() => id}
        onDragStart={() => setActiveTerminal(id)}
        renderToolbar={() => <TerminalToolbar terminalId={id} />}
        renderPreview={() => (
          <div className="tile-preview">
            <span>{terminal.title}</span>
          </div>
        )}
      >
        <TerminalPanel terminalId={id} />
      </MosaicWindow>
    );
  };

  if (!layout) {
    return (
      <div className="tile-container tile-container-empty">
        <div className="empty-state">
          <div className="empty-state-icon">⬡</div>
          <h2>No terminals open</h2>
          <p>Create a new terminal or launch an agent from the sidebar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tile-container">
      <Mosaic<string>
        renderTile={renderTile}
        value={layout}
        onChange={handleLayoutChange}
        className="mosaic-blueprint-theme"
        zeroStateView={
          <div className="empty-state">
            <div className="empty-state-icon">⬡</div>
            <h2>No terminals open</h2>
            <p>Create a new terminal or launch an agent from the sidebar</p>
          </div>
        }
      />
    </div>
  );
}

import { Mosaic, MosaicWindow, MosaicNode, MosaicBranch } from 'react-mosaic-component';
import { TerminalPanel } from '../terminal/TerminalPanel';
import { useLayoutStore, snapLayoutNode } from '../../store/layoutStore';
import { useTerminalStore } from '../../store/terminalStore';
import 'react-mosaic-component/react-mosaic-component.css';
import './TileContainer.css';


// Close button component for toolbar controls
function CloseButton({ terminalId }: { terminalId: string }) {
  const { killTerminal } = useTerminalStore();
  const { removeTile } = useLayoutStore();

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    killTerminal(terminalId);
    removeTile(terminalId);
  };

  return (
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
  );
}

export function TileContainer() {
  const { layout, setLayout, snapEnabled, snapIncrement } = useLayoutStore();
  const { terminals, setActiveTerminal } = useTerminalStore();

  const handleLayoutChange = (newLayout: MosaicNode<string> | null) => {
    setLayout(newLayout);
  };

  const handleLayoutRelease = (newLayout: MosaicNode<string> | null) => {
    if (!newLayout || !snapEnabled) return;
    if (typeof newLayout === 'string') {
      setLayout(newLayout);
      return;
    }
    const snappedLayout = snapLayoutNode(newLayout, snapIncrement);
    setLayout(snappedLayout);
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
        toolbarControls={<CloseButton terminalId={id} />}
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
        onRelease={handleLayoutRelease}
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

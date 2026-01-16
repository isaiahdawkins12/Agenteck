import { Mosaic, MosaicWindow, MosaicNode } from 'react-mosaic-component';
import { TerminalPanel } from '../terminal/TerminalPanel';
import { useLayoutStore } from '../../store/layoutStore';
import { useTerminalStore } from '../../store/terminalStore';
import 'react-mosaic-component/react-mosaic-component.css';
import './TileContainer.css';

export function TileContainer() {
  const { layout, setLayout } = useLayoutStore();
  const { terminals } = useTerminalStore();

  const handleLayoutChange = (newLayout: MosaicNode<string> | null) => {
    setLayout(newLayout);
  };

  const renderTile = (id: string, path: number[]) => {
    const terminal = terminals[id];

    if (!terminal) {
      return (
        <MosaicWindow<string>
          path={path}
          title=""
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
        title=""
        toolbarControls={null}
        createNode={() => id}
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

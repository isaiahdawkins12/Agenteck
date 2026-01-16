import { useTerminal } from '../../hooks/useTerminal';
import { useSettingsStore } from '../../store/settingsStore';
import './Toolbar.css';

export function Toolbar() {
  const { createNewTerminal, splitTerminal, closeAllTerminals, terminals } = useTerminal();
  const { toggleSidebar, sidebarCollapsed } = useSettingsStore();

  const terminalCount = Object.keys(terminals).length;

  const handleNewTerminal = async () => {
    await createNewTerminal();
  };

  const handleSplitHorizontal = async () => {
    await splitTerminal('row');
  };

  const handleSplitVertical = async () => {
    await splitTerminal('column');
  };

  const handleCloseAll = async () => {
    if (terminalCount > 0) {
      await closeAllTerminals();
    }
  };

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <button
          className="toolbar-button"
          onClick={toggleSidebar}
          title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 2h12v12H2V2zm1 1v10h3V3H3zm4 0v10h6V3H7z" />
          </svg>
        </button>

        <div className="toolbar-divider" />

        <button
          className="toolbar-button"
          onClick={handleNewTerminal}
          title="New terminal"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 2v6H2v2h6v6h2v-6h6V8H10V2H8z" />
          </svg>
          <span>New</span>
        </button>

        <button
          className="toolbar-button"
          onClick={handleSplitHorizontal}
          title="Split horizontal"
          disabled={terminalCount === 0}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 2h12v12H2V2zm1 1v10h5V3H3zm6 0v10h4V3H9z" />
          </svg>
          <span>Split H</span>
        </button>

        <button
          className="toolbar-button"
          onClick={handleSplitVertical}
          title="Split vertical"
          disabled={terminalCount === 0}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 2h12v12H2V2zm1 1v4h10V3H3zm0 5v5h10V8H3z" />
          </svg>
          <span>Split V</span>
        </button>
      </div>

      <div className="toolbar-center">
        {terminalCount > 0 && (
          <span className="terminal-count">
            {terminalCount} terminal{terminalCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="toolbar-right">
        {terminalCount > 0 && (
          <button
            className="toolbar-button toolbar-button-danger"
            onClick={handleCloseAll}
            title="Close all terminals"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
            </svg>
            <span>Close All</span>
          </button>
        )}
      </div>
    </div>
  );
}

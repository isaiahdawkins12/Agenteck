import { useEffect } from 'react';
import { Titlebar } from './components/titlebar/Titlebar';
import { Sidebar } from './components/sidebar/Sidebar';
import { TileContainer } from './components/layout/TileContainer';
import { Toolbar } from './components/layout/Toolbar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useSettingsStore } from './store/settingsStore';
import { useLayoutStore } from './store/layoutStore';
import { useTerminalStore } from './store/terminalStore';
import { IPC_CHANNELS } from '@shared/constants';
import type { TerminalSession } from '@shared/types';
import './styles/app.css';

function App() {
  const { sidebarCollapsed, loadAgents } = useSettingsStore();
  const { loadWorkspace, addTile } = useLayoutStore();
  const { initializeListeners, addExternalTerminal } = useTerminalStore();

  useEffect(() => {
    loadWorkspace();
    loadAgents();
    const cleanup = initializeListeners();
    return cleanup;
  }, [loadWorkspace, loadAgents, initializeListeners]);

  // Listen for terminals created from CLI startup arguments
  useEffect(() => {
    const handleTerminalCreated = (session: TerminalSession) => {
      addExternalTerminal(session);
      addTile(session.id);
    };

    const unsubscribe = window.electronAPI.on(
      IPC_CHANNELS.TERMINAL.CREATED,
      handleTerminalCreated
    );

    return () => {
      unsubscribe();
    };
  }, [addExternalTerminal, addTile]);

  return (
    <ErrorBoundary>
      <div className="app">
        <Titlebar />
        <div className="app-content">
          <Sidebar collapsed={sidebarCollapsed} />
          <main className="main-area">
            <Toolbar />
            <ErrorBoundary>
              <TileContainer />
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;

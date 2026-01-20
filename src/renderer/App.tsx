import { useEffect } from 'react';
import { Titlebar } from './components/titlebar/Titlebar';
import { Sidebar } from './components/sidebar/Sidebar';
import { TileContainer } from './components/layout/TileContainer';
import { Toolbar } from './components/layout/Toolbar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useSettingsStore } from './store/settingsStore';
import { useLayoutStore } from './store/layoutStore';
import { useTerminalStore } from './store/terminalStore';
import './styles/app.css';

function App() {
  const { sidebarCollapsed, loadAgents } = useSettingsStore();
  const { loadWorkspace } = useLayoutStore();
  const { initializeListeners } = useTerminalStore();

  useEffect(() => {
    loadWorkspace();
    loadAgents();
    const cleanup = initializeListeners();
    return cleanup;
  }, [loadWorkspace, loadAgents, initializeListeners]);

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

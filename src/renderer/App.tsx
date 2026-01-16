import { useEffect } from 'react';
import { Titlebar } from './components/titlebar/Titlebar';
import { Sidebar } from './components/sidebar/Sidebar';
import { TileContainer } from './components/layout/TileContainer';
import { Toolbar } from './components/layout/Toolbar';
import { useSettingsStore } from './store/settingsStore';
import { useLayoutStore } from './store/layoutStore';
import { useTerminalStore } from './store/terminalStore';
import './styles/app.css';

function App() {
  const { sidebarCollapsed } = useSettingsStore();
  const { loadWorkspace } = useLayoutStore();
  const { initializeListeners } = useTerminalStore();

  useEffect(() => {
    loadWorkspace();
    const cleanup = initializeListeners();
    return cleanup;
  }, [loadWorkspace, initializeListeners]);

  return (
    <div className="app">
      <Titlebar />
      <div className="app-content">
        <Sidebar collapsed={sidebarCollapsed} />
        <main className="main-area">
          <Toolbar />
          <TileContainer />
        </main>
      </div>
    </div>
  );
}

export default App;

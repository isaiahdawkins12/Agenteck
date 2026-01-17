import { useState } from 'react';
import { AgentList } from './AgentList';
import { LayoutPresets } from './LayoutPresets';
import { TerminalList } from './TerminalList';
import { WorktreePanel } from './WorktreePanel';
import { useTerminal } from '../../hooks/useTerminal';
import './Sidebar.css';

interface SidebarProps {
  collapsed: boolean;
}

type Tab = 'agents' | 'terminals' | 'layouts' | 'git';

export function Sidebar({ collapsed }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<Tab>('agents');
  const { createNewTerminal } = useTerminal();

  const handleNewTerminal = async () => {
    await createNewTerminal();
  };

  if (collapsed) {
    return (
      <div className="sidebar sidebar-collapsed">
        <div className="sidebar-icons">
          <button
            className={`sidebar-icon ${activeTab === 'agents' ? 'active' : ''}`}
            onClick={() => setActiveTab('agents')}
            title="Agents"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2a4 4 0 00-4 4v1H5a2 2 0 00-2 2v7a2 2 0 002 2h10a2 2 0 002-2V9a2 2 0 00-2-2h-1V6a4 4 0 00-4-4zm-2 4a2 2 0 114 0v1H8V6zm2 6a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
          </button>
          <button
            className={`sidebar-icon ${activeTab === 'terminals' ? 'active' : ''}`}
            onClick={() => setActiveTab('terminals')}
            title="Terminals"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            className={`sidebar-icon ${activeTab === 'layouts' ? 'active' : ''}`}
            onClick={() => setActiveTab('layouts')}
            title="Layouts"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zm10-1a1 1 0 00-1 1v6a1 1 0 001 1h4a1 1 0 001-1v-6a1 1 0 00-1-1h-4z" />
            </svg>
          </button>
          <button
            className={`sidebar-icon ${activeTab === 'git' ? 'active' : ''}`}
            onClick={() => setActiveTab('git')}
            title="Git Worktrees"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1.323l-3.954 1.582a1.5 1.5 0 01-1.096 0L2 5.118V3a1 1 0 00-2 0v14a1 1 0 102 0v-2.118l1.95.78a3.5 3.5 0 002.558 0L10 14.323V16a1 1 0 102 0v-1.677l3.954-1.582a1.5 1.5 0 011.096 0L19 13.523V17a1 1 0 102 0V3a1 1 0 10-2 0v2.323l-1.95-.78a3.5 3.5 0 00-2.558 0L11 5.882V3a1 1 0 00-1-1zm1 4.677l3.954-1.582a1.5 1.5 0 011.096 0L19 6.677v4.646l-1.95-.78a3.5 3.5 0 00-2.558 0L11 12.123V6.677zM9 7.118L5.046 8.7a1.5 1.5 0 01-1.096 0L2 7.918v4.405l1.95.78a3.5 3.5 0 002.558 0L9 11.523V7.118z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <div className="sidebar-bottom">
          <button
            className="sidebar-icon"
            onClick={handleNewTerminal}
            title="New terminal"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-tabs">
          <button
            className={`sidebar-tab ${activeTab === 'agents' ? 'active' : ''}`}
            onClick={() => setActiveTab('agents')}
          >
            Agents
          </button>
          <button
            className={`sidebar-tab ${activeTab === 'terminals' ? 'active' : ''}`}
            onClick={() => setActiveTab('terminals')}
          >
            Terminals
          </button>
          <button
            className={`sidebar-tab ${activeTab === 'layouts' ? 'active' : ''}`}
            onClick={() => setActiveTab('layouts')}
          >
            Layouts
          </button>
          <button
            className={`sidebar-tab ${activeTab === 'git' ? 'active' : ''}`}
            onClick={() => setActiveTab('git')}
          >
            Git
          </button>
        </div>
      </div>

      <div className="sidebar-content">
        {activeTab === 'agents' && <AgentList />}
        {activeTab === 'terminals' && <TerminalList />}
        {activeTab === 'layouts' && <LayoutPresets />}
        {activeTab === 'git' && <WorktreePanel />}
      </div>

      <div className="sidebar-footer">
        <button className="sidebar-action-button" onClick={handleNewTerminal}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 2v6H2v2h6v6h2v-6h6V8H10V2H8z" />
          </svg>
          <span>New Terminal</span>
        </button>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import { useTerminal } from '../../hooks/useTerminal';
import { AgentIcon } from './AgentIcon';
import type { AgentPreset } from '@shared/types';
import './AgentLaunchButton.css';

interface AgentLaunchButtonProps {
  agent: AgentPreset;
  onRemove?: () => void;
}

export function AgentLaunchButton({ agent, onRemove }: AgentLaunchButtonProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [recentDirectories, setRecentDirectories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  const { launchAgent } = useTerminal();
  const {
    loadRecentDirectories,
    addRecentDirectory,
    selectDirectory,
    setAgentDefaultCwd,
  } = useSettingsStore();

  // Load recent directories when dropdown opens
  useEffect(() => {
    if (isDropdownOpen) {
      loadRecentDirectories(agent.id).then(setRecentDirectories);
    }
  }, [isDropdownOpen, agent.id, loadRecentDirectories]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  const handleLaunch = useCallback(
    async (cwd?: string) => {
      try {
        setIsLoading(true);
        setIsDropdownOpen(false);

        if (cwd) {
          await addRecentDirectory(agent.id, cwd);
        }

        await launchAgent(agent, cwd);
      } catch (error) {
        console.error('Failed to launch agent:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [agent, launchAgent, addRecentDirectory]
  );

  const handleBrowse = useCallback(async () => {
    const directory = await selectDirectory();
    if (directory) {
      handleLaunch(directory);
    }
  }, [selectDirectory, handleLaunch]);

  const handleSetDefault = useCallback(
    async (directory?: string) => {
      let dir = directory;
      if (!dir) {
        dir = (await selectDirectory()) ?? undefined;
      }
      if (dir) {
        setAgentDefaultCwd(agent.id, dir);
        setIsDropdownOpen(false);
      }
    },
    [selectDirectory, setAgentDefaultCwd, agent.id]
  );

  const handleClearDefault = useCallback(() => {
    setAgentDefaultCwd(agent.id, undefined);
    setIsDropdownOpen(false);
  }, [setAgentDefaultCwd, agent.id]);

  const handleMainClick = () => {
    // If there's a default or recent directories, just launch with default
    handleLaunch(agent.defaultCwd);
  };

  const handleDropdownToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDropdownOpen(!isDropdownOpen);
  };

  const formatPath = (path: string) => {
    // Show a shortened version of the path
    const parts = path.replace(/\\/g, '/').split('/');
    if (parts.length > 3) {
      return `.../${parts.slice(-2).join('/')}`;
    }
    return path;
  };

  return (
    <div className="agent-launch-wrapper">
      <div ref={buttonRef} className={`agent-item ${isLoading ? 'loading' : ''}`}>
        <button
          className="agent-main-button"
          onClick={handleMainClick}
          title={agent.description || `Launch ${agent.name}`}
          disabled={isLoading}
        >
          <div className="agent-icon">
            <AgentIcon agentId={agent.id} size={24} />
          </div>
          <div className="agent-info">
            <span className="agent-name">{agent.name}</span>
            <span className="agent-command">
              {agent.defaultCwd ? formatPath(agent.defaultCwd) : `${agent.command} ${agent.args.join(' ')}`}
            </span>
          </div>
        </button>
        <button
          className="agent-dropdown-toggle"
          onClick={handleDropdownToggle}
          title="Choose directory"
          disabled={isLoading}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M2.5 4.5L6 8L9.5 4.5H2.5Z" />
          </svg>
        </button>
      </div>

      {isDropdownOpen && (
        <div ref={dropdownRef} className="agent-directory-dropdown">
          <div className="dropdown-section">
            <div className="dropdown-section-header">Launch in Directory</div>

            {/* Default directory option */}
            {agent.defaultCwd && (
              <button
                className="dropdown-item default-item"
                onClick={() => handleLaunch(agent.defaultCwd)}
                title={agent.defaultCwd}
              >
                <svg className="dropdown-item-icon" width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                  <path d="M2 2.5a.5.5 0 01.5-.5h3.793a.5.5 0 01.354.146l.853.854H11.5a.5.5 0 01.5.5v8a.5.5 0 01-.5.5h-9a.5.5 0 01-.5-.5v-9z" />
                </svg>
                <span className="dropdown-item-text">
                  <span className="item-label">Default</span>
                  <span className="item-path">{formatPath(agent.defaultCwd)}</span>
                </span>
                <span className="default-badge">Default</span>
              </button>
            )}

            {/* Recent directories */}
            {recentDirectories.length > 0 && (
              <div className="recent-directories-list">
                {recentDirectories
                  .filter((dir) => dir !== agent.defaultCwd)
                  .map((dir) => (
                    <button
                      key={dir}
                      className="dropdown-item"
                      onClick={() => handleLaunch(dir)}
                      title={dir}
                    >
                      <svg className="dropdown-item-icon" width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                        <path d="M2 2.5a.5.5 0 01.5-.5h3.793a.5.5 0 01.354.146l.853.854H11.5a.5.5 0 01.5.5v8a.5.5 0 01-.5.5h-9a.5.5 0 01-.5-.5v-9z" />
                      </svg>
                      <span className="dropdown-item-text">
                        <span className="item-path">{formatPath(dir)}</span>
                      </span>
                      <button
                        className="set-default-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetDefault(dir);
                        }}
                        title="Set as default"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                          <path d="M6 1l1.5 3 3.5.5-2.5 2.5.5 3.5L6 9l-3 1.5.5-3.5L1 4.5 4.5 4 6 1z" />
                        </svg>
                      </button>
                    </button>
                  ))}
              </div>
            )}

            {/* Browse option */}
            <button className="dropdown-item browse-item" onClick={handleBrowse}>
              <svg className="dropdown-item-icon" width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <path d="M4.5 3a.5.5 0 00-.5.5v7a.5.5 0 00.5.5h5a.5.5 0 00.5-.5v-5.5L7 2H4.5a.5.5 0 00-.5.5zm5 3.5V5.5L8.5 4.5v2H9.5z" />
                <path d="M2 5.5a.5.5 0 01.5-.5H3v6h7v.5a.5.5 0 01-.5.5h-7a.5.5 0 01-.5-.5v-6z" />
              </svg>
              <span className="dropdown-item-text">Browse...</span>
            </button>
          </div>

          <div className="dropdown-divider" />

          <div className="dropdown-section">
            <div className="dropdown-section-header">Settings</div>
            <button className="dropdown-item" onClick={() => handleSetDefault()}>
              <svg className="dropdown-item-icon" width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <path d="M6 1l1.5 3 3.5.5-2.5 2.5.5 3.5L6 9l-3 1.5.5-3.5L1 4.5 4.5 4 6 1z" />
              </svg>
              <span className="dropdown-item-text">Set default directory...</span>
            </button>
            {agent.defaultCwd && (
              <button className="dropdown-item danger-item" onClick={handleClearDefault}>
                <svg className="dropdown-item-icon" width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                  <path d="M4.5 3l-.5.5v1h6v-1L9.5 3h-5zM3 5v6.5a.5.5 0 00.5.5h7a.5.5 0 00.5-.5V5H3z" />
                </svg>
                <span className="dropdown-item-text">Clear default directory</span>
              </button>
            )}
            {onRemove && (
              <button className="dropdown-item danger-item" onClick={onRemove}>
                <svg className="dropdown-item-icon" width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                  <path d="M6 1.41L4.59 0 0 4.59l1.41 1.41 4.59-4.59zM1.41 6L0 7.41 4.59 12l1.41-1.41-4.59-4.59zM12 1.41L10.59 0 6 4.59l1.41 1.41 4.59-4.59zM7.41 6L6 7.41 10.59 12 12 10.59 7.41 6z" />
                </svg>
                <span className="dropdown-item-text">Remove agent</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

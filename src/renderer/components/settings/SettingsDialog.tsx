import { useState, useEffect } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import { useThemeStore } from '../../store/themeStore';
import { ThemeEditor } from './ThemeEditor';
import type { ShellType } from '@shared/types';
import './SettingsDialog.css';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'general' | 'terminal' | 'themes' | 'agents';

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const {
    defaultShell,
    setDefaultShell,
    availableShells,
    loadAvailableShells,
    autoSave,
    setAutoSave,
  } = useSettingsStore();
  const { terminalThemes, activeTerminalThemeId, setActiveTerminalTheme } = useThemeStore();

  useEffect(() => {
    if (isOpen) {
      loadAvailableShells();
    }
  }, [isOpen, loadAvailableShells]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="settings-overlay" onClick={handleOverlayClick}>
      <div className="settings-dialog">
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="settings-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z" />
            </svg>
          </button>
        </div>

        <div className="settings-body">
          <div className="settings-sidebar">
            <button
              className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
              onClick={() => setActiveTab('general')}
            >
              General
            </button>
            <button
              className={`settings-tab ${activeTab === 'terminal' ? 'active' : ''}`}
              onClick={() => setActiveTab('terminal')}
            >
              Terminal
            </button>
            <button
              className={`settings-tab ${activeTab === 'themes' ? 'active' : ''}`}
              onClick={() => setActiveTab('themes')}
            >
              Themes
            </button>
            <button
              className={`settings-tab ${activeTab === 'agents' ? 'active' : ''}`}
              onClick={() => setActiveTab('agents')}
            >
              Agents
            </button>
          </div>

          <div className="settings-content">
            {activeTab === 'general' && (
              <div className="settings-section">
                <h3>General Settings</h3>

                <div className="settings-group">
                  <label className="settings-label">
                    <span>Auto-save workspace</span>
                    <input
                      type="checkbox"
                      checked={autoSave}
                      onChange={(e) => setAutoSave(e.target.checked)}
                    />
                  </label>
                  <p className="settings-description">
                    Automatically save workspace layout and settings
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'terminal' && (
              <div className="settings-section">
                <h3>Terminal Settings</h3>

                <div className="settings-group">
                  <label className="settings-label">Default Shell</label>
                  <select
                    value={defaultShell}
                    onChange={(e) => setDefaultShell(e.target.value as ShellType)}
                  >
                    {availableShells
                      .filter((s) => s.available)
                      .map((shell) => (
                        <option key={shell.id} value={shell.id}>
                          {shell.name}
                        </option>
                      ))}
                  </select>
                  <p className="settings-description">
                    Shell to use when creating new terminals
                  </p>
                </div>

                <div className="settings-group">
                  <label className="settings-label">Default Theme</label>
                  <select
                    value={activeTerminalThemeId}
                    onChange={(e) => setActiveTerminalTheme(e.target.value)}
                  >
                    {terminalThemes.map((theme) => (
                      <option key={theme.id} value={theme.id}>
                        {theme.name}
                      </option>
                    ))}
                  </select>
                  <p className="settings-description">
                    Default color theme for new terminals
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'themes' && <ThemeEditor />}

            {activeTab === 'agents' && (
              <div className="settings-section">
                <h3>Agent Presets</h3>
                <p className="settings-description">
                  Configure CLI agent presets. Built-in agents cannot be modified.
                </p>
                {/* Agent configuration would go here */}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useThemeStore } from '../../store/themeStore';
import type { ThemeConfig } from '@shared/types';
import { v4 as uuidv4 } from 'uuid';
import './ThemeEditor.css';

export function ThemeEditor() {
  const {
    terminalThemes,
    activeTerminalThemeId,
    setActiveTerminalTheme,
    addCustomTheme,
    updateTheme,
    deleteTheme,
  } = useThemeStore();

  const [editingTheme, setEditingTheme] = useState<ThemeConfig | null>(null);

  const handleCreateTheme = () => {
    const baseTheme = terminalThemes.find((t) => t.id === activeTerminalThemeId);
    if (!baseTheme) return;

    const newTheme: ThemeConfig = {
      ...baseTheme,
      id: uuidv4(),
      name: `${baseTheme.name} (Copy)`,
      isBuiltIn: false,
    };

    setEditingTheme(newTheme);
  };

  const handleSaveTheme = () => {
    if (!editingTheme) return;

    const existingTheme = terminalThemes.find((t) => t.id === editingTheme.id);
    if (existingTheme) {
      updateTheme(editingTheme.id, editingTheme);
    } else {
      addCustomTheme(editingTheme);
    }

    setEditingTheme(null);
  };

  const handleDeleteTheme = (themeId: string) => {
    if (confirm('Are you sure you want to delete this theme?')) {
      deleteTheme(themeId);
    }
  };

  const handleColorChange = (colorKey: keyof ThemeConfig['colors'], value: string) => {
    if (!editingTheme) return;
    setEditingTheme({
      ...editingTheme,
      colors: {
        ...editingTheme.colors,
        [colorKey]: value,
      },
    });
  };

  if (editingTheme) {
    return (
      <div className="theme-editor">
        <div className="theme-editor-header">
          <h3>Edit Theme</h3>
          <div className="theme-editor-actions">
            <button
              className="theme-editor-button secondary"
              onClick={() => setEditingTheme(null)}
            >
              Cancel
            </button>
            <button className="theme-editor-button primary" onClick={handleSaveTheme}>
              Save
            </button>
          </div>
        </div>

        <div className="theme-editor-form">
          <div className="theme-editor-field">
            <label>Theme Name</label>
            <input
              type="text"
              value={editingTheme.name}
              onChange={(e) =>
                setEditingTheme({ ...editingTheme, name: e.target.value })
              }
            />
          </div>

          <div className="theme-editor-colors">
            <h4>Colors</h4>
            <div className="color-grid">
              {Object.entries(editingTheme.colors).map(([key, value]) => (
                <div key={key} className="color-field">
                  <label>{formatColorName(key)}</label>
                  <div className="color-input-wrapper">
                    <input
                      type="color"
                      value={value}
                      onChange={(e) =>
                        handleColorChange(
                          key as keyof ThemeConfig['colors'],
                          e.target.value
                        )
                      }
                    />
                    <input
                      type="text"
                      value={value}
                      onChange={(e) =>
                        handleColorChange(
                          key as keyof ThemeConfig['colors'],
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="theme-editor-preview">
            <h4>Preview</h4>
            <div
              className="theme-preview-box"
              style={{
                backgroundColor: editingTheme.colors.background,
                color: editingTheme.colors.foreground,
              }}
            >
              <span style={{ color: editingTheme.colors.green }}>user@host</span>
              <span>:</span>
              <span style={{ color: editingTheme.colors.blue }}>~/projects</span>
              <span>$ </span>
              <span>echo &quot;Hello, World!&quot;</span>
              <br />
              <span>Hello, World!</span>
              <br />
              <span style={{ color: editingTheme.colors.red }}>error: </span>
              <span>Something went wrong</span>
              <br />
              <span style={{ color: editingTheme.colors.yellow }}>warning: </span>
              <span>Check this out</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="theme-editor">
      <div className="theme-editor-header">
        <h3>Terminal Themes</h3>
        <button className="theme-editor-button primary" onClick={handleCreateTheme}>
          New Theme
        </button>
      </div>

      <div className="theme-list">
        {terminalThemes.map((theme) => (
          <div
            key={theme.id}
            className={`theme-item ${activeTerminalThemeId === theme.id ? 'active' : ''}`}
            onClick={() => setActiveTerminalTheme(theme.id)}
          >
            <div className="theme-item-colors">
              <span
                className="theme-color-dot"
                style={{ backgroundColor: theme.colors.background }}
              />
              <span
                className="theme-color-dot"
                style={{ backgroundColor: theme.colors.foreground }}
              />
              <span
                className="theme-color-dot"
                style={{ backgroundColor: theme.colors.red }}
              />
              <span
                className="theme-color-dot"
                style={{ backgroundColor: theme.colors.green }}
              />
              <span
                className="theme-color-dot"
                style={{ backgroundColor: theme.colors.blue }}
              />
            </div>
            <div className="theme-item-info">
              <span className="theme-item-name">{theme.name}</span>
              {theme.isBuiltIn && <span className="theme-item-badge">Built-in</span>}
            </div>
            <div className="theme-item-actions">
              {!theme.isBuiltIn && (
                <>
                  <button
                    className="theme-item-action"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingTheme(theme);
                    }}
                    title="Edit theme"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                      <path d="M11.854 1.146a.5.5 0 010 .708l-.647.646 1.793 1.793.647-.646a.5.5 0 01.707.707l-7.5 7.5a.5.5 0 01-.233.131l-3 1a.5.5 0 01-.617-.617l1-3a.5.5 0 01.131-.232l7.5-7.5a.5.5 0 01.707 0l1.512 1.511z" />
                    </svg>
                  </button>
                  <button
                    className="theme-item-action danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTheme(theme.id);
                    }}
                    title="Delete theme"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                      <path d="M5.5 5.5A.5.5 0 016 6v5a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v5a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v5a.5.5 0 001 0V6z" />
                      <path fillRule="evenodd" d="M13 3a1 1 0 01-1 1H2a1 1 0 01-1-1V2a1 1 0 011-1h3a1 1 0 011-1h2a1 1 0 011 1h3a1 1 0 011 1v1zM2 4h10v9a1 1 0 01-1 1H3a1 1 0 01-1-1V4z" clipRule="evenodd" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatColorName(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

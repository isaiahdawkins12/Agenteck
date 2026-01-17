import { useState } from 'react';
import { useThemeStore, CategoryFilter } from '../../store/themeStore';
import type { ThemeConfig, ThemeCategory } from '@shared/types';
import { v4 as uuidv4 } from 'uuid';
import './ThemeEditor.css';

interface ImportStatus {
  type: 'success' | 'error' | 'info';
  message: string;
}

export function ThemeEditor() {
  const {
    activeTerminalThemeId,
    setActiveTerminalTheme,
    addCustomTheme,
    updateTheme,
    deleteTheme,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    getFilteredThemes,
    getThemeCategory,
    exportTheme,
    openImportDialog,
  } = useThemeStore();

  const [editingTheme, setEditingTheme] = useState<ThemeConfig | null>(null);
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null);

  const filteredThemes = getFilteredThemes();

  const handleCreateTheme = () => {
    const themes = useThemeStore.getState().terminalThemes;
    const baseTheme = themes.find((t) => t.id === activeTerminalThemeId);
    if (!baseTheme) return;

    const newTheme: ThemeConfig = {
      ...baseTheme,
      id: uuidv4(),
      name: `${baseTheme.name} (Copy)`,
      isBuiltIn: false,
      category: 'custom',
    };

    setEditingTheme(newTheme);
  };

  const handleSaveTheme = () => {
    if (!editingTheme) return;

    const themes = useThemeStore.getState().terminalThemes;
    const existingTheme = themes.find((t) => t.id === editingTheme.id);
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

  const handleExport = async (themeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await exportTheme(themeId);
    if (result.success) {
      setImportStatus({ type: 'success', message: 'Theme exported successfully' });
    } else if (result.error) {
      setImportStatus({ type: 'error', message: `Export failed: ${result.error}` });
    }
    setTimeout(() => setImportStatus(null), 3000);
  };

  const handleImport = async () => {
    const result = await openImportDialog();
    if (result.success) {
      if (result.importedCount > 0) {
        const errorMessage = result.errors.length > 0 ? ` (${result.errors.length} warnings)` : '';
        setImportStatus({
          type: result.errors.length > 0 ? 'info' : 'success',
          message: `Imported ${result.importedCount} theme${result.importedCount > 1 ? 's' : ''}${errorMessage}`,
        });
      }
    }
    setTimeout(() => setImportStatus(null), 5000);
  };

  const groupThemesByCategory = (themes: ThemeConfig[]) => {
    const groups: Record<ThemeCategory, ThemeConfig[]> = {
      'built-in': [],
      'custom': [],
      'imported': [],
    };

    themes.forEach((theme) => {
      const category = getThemeCategory(theme);
      groups[category].push(theme);
    });

    return groups;
  };

  const categoryLabels: Record<ThemeCategory, string> = {
    'built-in': 'Built-in Themes',
    'custom': 'Custom Themes',
    'imported': 'Imported Themes',
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

  const groupedThemes = groupThemesByCategory(filteredThemes);

  return (
    <div className="theme-editor">
      <div className="theme-editor-header">
        <h3>Terminal Themes</h3>
        <div className="theme-editor-actions">
          <button className="theme-editor-button secondary" onClick={handleImport}>
            Import
          </button>
          <button className="theme-editor-button primary" onClick={handleCreateTheme}>
            New Theme
          </button>
        </div>
      </div>

      {importStatus && (
        <div className={`theme-import-status ${importStatus.type}`}>
          {importStatus.message}
        </div>
      )}

      <div className="theme-filter-bar">
        <input
          type="text"
          className="theme-search-input"
          placeholder="Search themes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="theme-category-filters">
          {(['all', 'built-in', 'custom', 'imported'] as const).map((filter) => (
            <button
              key={filter}
              className={`theme-category-button ${categoryFilter === filter ? 'active' : ''}`}
              onClick={() => setCategoryFilter(filter as CategoryFilter)}
            >
              {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="theme-list">
        {categoryFilter === 'all' ? (
          // Show grouped by category
          (['built-in', 'custom', 'imported'] as ThemeCategory[]).map((category) => {
            const themes = groupedThemes[category];
            if (themes.length === 0) return null;

            return (
              <div key={category} className="theme-category-section">
                <h4 className="theme-category-header">{categoryLabels[category]}</h4>
                {themes.map((theme) => (
                  <ThemeItem
                    key={theme.id}
                    theme={theme}
                    isActive={activeTerminalThemeId === theme.id}
                    category={getThemeCategory(theme)}
                    onSelect={() => setActiveTerminalTheme(theme.id)}
                    onEdit={() => setEditingTheme(theme)}
                    onDelete={() => handleDeleteTheme(theme.id)}
                    onExport={(e) => handleExport(theme.id, e)}
                  />
                ))}
              </div>
            );
          })
        ) : (
          // Show flat list for specific category
          filteredThemes.map((theme) => (
            <ThemeItem
              key={theme.id}
              theme={theme}
              isActive={activeTerminalThemeId === theme.id}
              category={getThemeCategory(theme)}
              onSelect={() => setActiveTerminalTheme(theme.id)}
              onEdit={() => setEditingTheme(theme)}
              onDelete={() => handleDeleteTheme(theme.id)}
              onExport={(e) => handleExport(theme.id, e)}
            />
          ))
        )}

        {filteredThemes.length === 0 && (
          <div className="theme-empty-state">
            No themes found matching your criteria
          </div>
        )}
      </div>
    </div>
  );
}

interface ThemeItemProps {
  theme: ThemeConfig;
  isActive: boolean;
  category: ThemeCategory;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onExport: (e: React.MouseEvent) => void;
}

function ThemeItem({ theme, isActive, category, onSelect, onEdit, onDelete, onExport }: ThemeItemProps) {
  return (
    <div
      className={`theme-item ${isActive ? 'active' : ''}`}
      onClick={onSelect}
    >
      <div className="theme-item-preview">
        <div
          className="theme-mini-preview"
          style={{ backgroundColor: theme.colors.background }}
        >
          <span style={{ color: theme.colors.green }}>$</span>
          <span style={{ color: theme.colors.foreground }}> ls</span>
          <br />
          <span style={{ color: theme.colors.blue }}>dir/</span>
          <span style={{ color: theme.colors.foreground }}> file.txt</span>
        </div>
      </div>
      <div className="theme-item-info">
        <span className="theme-item-name">{theme.name}</span>
        <div className="theme-item-badges">
          {category === 'built-in' && <span className="theme-item-badge">Built-in</span>}
          {category === 'imported' && <span className="theme-item-badge imported">Imported</span>}
          {theme.source && <span className="theme-item-source">{theme.source}</span>}
        </div>
      </div>
      <div className="theme-item-actions">
        <button
          className="theme-item-action"
          onClick={onExport}
          title="Export theme"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M7 1a.5.5 0 01.5.5v6.793l2.146-2.147a.5.5 0 01.708.708l-3 3a.5.5 0 01-.708 0l-3-3a.5.5 0 11.708-.708L6.5 8.293V1.5A.5.5 0 017 1z" />
            <path d="M1.5 10a.5.5 0 01.5.5v1.5a.5.5 0 00.5.5h9a.5.5 0 00.5-.5v-1.5a.5.5 0 011 0v1.5a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 011 12v-1.5a.5.5 0 01.5-.5z" />
          </svg>
        </button>
        {category !== 'built-in' && (
          <>
            <button
              className="theme-item-action"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
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
                onDelete();
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
  );
}

function formatColorName(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

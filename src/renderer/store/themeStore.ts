import { create } from 'zustand';
import type { ThemeConfig, UITheme, ThemeCategory } from '@shared/types';
import { BUILT_IN_THEMES, DEFAULT_TERMINAL_THEME, IPC_CHANNELS } from '@shared/constants';

const DEFAULT_UI_THEME: UITheme = {
  id: 'dark',
  name: 'Dark',
  isDark: true,
  colors: {
    primary: '#89b4fa',
    secondary: '#cba6f7',
    accent: '#f5c2e7',
    background: '#1e1e2e',
    surface: '#313244',
    surfaceHover: '#45475a',
    border: '#45475a',
    text: '#cdd6f4',
    textSecondary: '#a6adc8',
    textMuted: '#6c7086',
    success: '#a6e3a1',
    warning: '#f9e2af',
    error: '#f38ba8',
    info: '#89b4fa',
  },
};

export type CategoryFilter = 'all' | ThemeCategory;

interface ImportResult {
  success: boolean;
  importedCount: number;
  errors: string[];
}

interface ThemeState {
  terminalThemes: ThemeConfig[];
  activeTerminalThemeId: string;
  uiTheme: UITheme;
  terminalThemeOverrides: Record<string, string>;
  searchQuery: string;
  categoryFilter: CategoryFilter;
}

interface ThemeActions {
  setActiveTerminalTheme: (themeId: string) => void;
  setTerminalThemeForTerminal: (terminalId: string, themeId: string) => void;
  getTerminalTheme: (terminalId?: string) => ThemeConfig;
  addCustomTheme: (theme: ThemeConfig) => void;
  updateTheme: (themeId: string, updates: Partial<ThemeConfig>) => void;
  deleteTheme: (themeId: string) => void;
  setUITheme: (theme: UITheme) => void;
  importThemes: (themes: ThemeConfig[]) => string[];
  exportTheme: (themeId: string) => Promise<{ success: boolean; error?: string }>;
  openImportDialog: () => Promise<ImportResult>;
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (filter: CategoryFilter) => void;
  getFilteredThemes: () => ThemeConfig[];
  getThemeCategory: (theme: ThemeConfig) => ThemeCategory;
}

type ThemeStore = ThemeState & ThemeActions;

export const useThemeStore = create<ThemeStore>((set, get) => ({
  terminalThemes: BUILT_IN_THEMES,
  activeTerminalThemeId: DEFAULT_TERMINAL_THEME.id,
  uiTheme: DEFAULT_UI_THEME,
  terminalThemeOverrides: {},
  searchQuery: '',
  categoryFilter: 'all',

  setActiveTerminalTheme: (themeId) => {
    set({ activeTerminalThemeId: themeId });
  },

  setTerminalThemeForTerminal: (terminalId, themeId) => {
    set((state) => ({
      terminalThemeOverrides: {
        ...state.terminalThemeOverrides,
        [terminalId]: themeId,
      },
    }));
  },

  getTerminalTheme: (terminalId) => {
    const { terminalThemes, activeTerminalThemeId, terminalThemeOverrides } = get();

    const themeId = terminalId
      ? terminalThemeOverrides[terminalId] || activeTerminalThemeId
      : activeTerminalThemeId;

    const theme = terminalThemes.find((t) => t.id === themeId);
    return theme || DEFAULT_TERMINAL_THEME;
  },

  addCustomTheme: (theme) => {
    set((state) => ({
      terminalThemes: [...state.terminalThemes, { ...theme, isBuiltIn: false, category: 'custom' }],
    }));
  },

  updateTheme: (themeId, updates) => {
    set((state) => ({
      terminalThemes: state.terminalThemes.map((t) =>
        t.id === themeId ? { ...t, ...updates } : t
      ),
    }));
  },

  deleteTheme: (themeId) => {
    set((state) => {
      const theme = state.terminalThemes.find((t) => t.id === themeId);
      if (theme?.isBuiltIn) return state;

      return {
        terminalThemes: state.terminalThemes.filter((t) => t.id !== themeId),
        activeTerminalThemeId:
          state.activeTerminalThemeId === themeId
            ? DEFAULT_TERMINAL_THEME.id
            : state.activeTerminalThemeId,
      };
    });
  },

  setUITheme: (theme) => {
    set({ uiTheme: theme });
    applyUITheme(theme);
  },

  importThemes: (themes) => {
    const { terminalThemes } = get();
    const renamedThemes: string[] = [];

    const processedThemes = themes.map((theme) => {
      let name = theme.name;
      let counter = 1;

      while (terminalThemes.some((t) => t.name === name)) {
        name = `${theme.name} (${counter})`;
        counter++;
      }

      if (name !== theme.name) {
        renamedThemes.push(`"${theme.name}" renamed to "${name}"`);
      }

      return {
        ...theme,
        name,
        isBuiltIn: false,
        category: 'imported' as ThemeCategory,
      };
    });

    set((state) => ({
      terminalThemes: [...state.terminalThemes, ...processedThemes],
    }));

    return renamedThemes;
  },

  exportTheme: async (themeId) => {
    const { terminalThemes } = get();
    const theme = terminalThemes.find((t) => t.id === themeId);

    if (!theme) {
      return { success: false, error: 'Theme not found' };
    }

    const result = await window.electronAPI.invoke(IPC_CHANNELS.THEME.EXPORT, theme) as {
      success: boolean;
      error?: string;
      canceled?: boolean;
    };

    if (result.canceled) {
      return { success: false };
    }

    return result;
  },

  openImportDialog: async () => {
    const result = await window.electronAPI.invoke(IPC_CHANNELS.THEME.IMPORT) as {
      success: boolean;
      themes?: ThemeConfig[];
      errors?: string[];
      canceled?: boolean;
    };

    if (result.canceled || !result.success) {
      return { success: false, importedCount: 0, errors: [] };
    }

    const themes = result.themes || [];
    const renamedMessages = get().importThemes(themes);

    return {
      success: true,
      importedCount: themes.length,
      errors: [...(result.errors || []), ...renamedMessages],
    };
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  setCategoryFilter: (filter) => {
    set({ categoryFilter: filter });
  },

  getFilteredThemes: () => {
    const { terminalThemes, searchQuery, categoryFilter, getThemeCategory } = get();

    return terminalThemes.filter((theme) => {
      const matchesSearch = searchQuery === '' ||
        theme.name.toLowerCase().includes(searchQuery.toLowerCase());

      const category = getThemeCategory(theme);
      const matchesCategory = categoryFilter === 'all' || category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  },

  getThemeCategory: (theme) => {
    if (theme.category) return theme.category;
    if (theme.isBuiltIn) return 'built-in';
    return 'custom';
  },
}));

function applyUITheme(theme: UITheme): void {
  const root = document.documentElement;

  for (const [key, value] of Object.entries(theme.colors)) {
    root.style.setProperty(`--color-${key}`, value);
  }

  root.setAttribute('data-theme', theme.isDark ? 'dark' : 'light');
}

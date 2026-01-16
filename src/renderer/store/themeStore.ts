import { create } from 'zustand';
import type { ThemeConfig, UITheme } from '@shared/types';
import { BUILT_IN_THEMES, DEFAULT_TERMINAL_THEME } from '@shared/constants';

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

interface ThemeState {
  terminalThemes: ThemeConfig[];
  activeTerminalThemeId: string;
  uiTheme: UITheme;
  terminalThemeOverrides: Record<string, string>;
}

interface ThemeActions {
  setActiveTerminalTheme: (themeId: string) => void;
  setTerminalThemeForTerminal: (terminalId: string, themeId: string) => void;
  getTerminalTheme: (terminalId?: string) => ThemeConfig;
  addCustomTheme: (theme: ThemeConfig) => void;
  updateTheme: (themeId: string, updates: Partial<ThemeConfig>) => void;
  deleteTheme: (themeId: string) => void;
  setUITheme: (theme: UITheme) => void;
}

type ThemeStore = ThemeState & ThemeActions;

export const useThemeStore = create<ThemeStore>((set, get) => ({
  terminalThemes: BUILT_IN_THEMES,
  activeTerminalThemeId: DEFAULT_TERMINAL_THEME.id,
  uiTheme: DEFAULT_UI_THEME,
  terminalThemeOverrides: {},

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
      terminalThemes: [...state.terminalThemes, { ...theme, isBuiltIn: false }],
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
}));

function applyUITheme(theme: UITheme): void {
  const root = document.documentElement;

  for (const [key, value] of Object.entries(theme.colors)) {
    root.style.setProperty(`--color-${key}`, value);
  }

  root.setAttribute('data-theme', theme.isDark ? 'dark' : 'light');
}

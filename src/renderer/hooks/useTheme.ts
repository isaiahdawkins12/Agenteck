import { useEffect } from 'react';
import { useThemeStore } from '../store/themeStore';

export function useTheme() {
  const { uiTheme, terminalThemes, activeTerminalThemeId, getTerminalTheme } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;

    // Apply UI theme colors as CSS variables
    for (const [key, value] of Object.entries(uiTheme.colors)) {
      root.style.setProperty(`--color-${key}`, value);
    }

    // Set theme mode attribute
    root.setAttribute('data-theme', uiTheme.isDark ? 'dark' : 'light');
  }, [uiTheme]);

  return {
    uiTheme,
    terminalThemes,
    activeTerminalThemeId,
    getTerminalTheme,
  };
}

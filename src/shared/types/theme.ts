export interface TerminalColors {
  background: string;
  foreground: string;
  cursor: string;
  cursorAccent?: string;
  selection?: string;
  selectionForeground?: string;
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  brightBlack: string;
  brightRed: string;
  brightGreen: string;
  brightYellow: string;
  brightBlue: string;
  brightMagenta: string;
  brightCyan: string;
  brightWhite: string;
}

export interface TerminalFont {
  family: string;
  size: number;
  lineHeight: number;
  weight?: number | string;
  letterSpacing?: number;
}

export type ThemeCategory = 'built-in' | 'custom' | 'imported';

export interface ThemeConfig {
  id: string;
  name: string;
  colors: TerminalColors;
  font: TerminalFont;
  opacity: number;
  isBuiltIn?: boolean;
  category?: ThemeCategory;
  source?: string; // filename for imported themes
}

export interface UITheme {
  id: string;
  name: string;
  isDark: boolean;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    surfaceHover: string;
    border: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

import { useEffect, useRef, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { useTerminalStore } from '../../store/terminalStore';
import { useThemeStore } from '../../store/themeStore';
import type { ThemeConfig } from '@shared/types';
import '@xterm/xterm/css/xterm.css';
import './TerminalView.css';

interface TerminalViewProps {
  terminalId: string;
}

function themeToXtermTheme(theme: ThemeConfig) {
  return {
    background: theme.colors.background,
    foreground: theme.colors.foreground,
    cursor: theme.colors.cursor,
    cursorAccent: theme.colors.cursorAccent,
    selectionBackground: theme.colors.selection,
    selectionForeground: theme.colors.selectionForeground,
    black: theme.colors.black,
    red: theme.colors.red,
    green: theme.colors.green,
    yellow: theme.colors.yellow,
    blue: theme.colors.blue,
    magenta: theme.colors.magenta,
    cyan: theme.colors.cyan,
    white: theme.colors.white,
    brightBlack: theme.colors.brightBlack,
    brightRed: theme.colors.brightRed,
    brightGreen: theme.colors.brightGreen,
    brightYellow: theme.colors.brightYellow,
    brightBlue: theme.colors.brightBlue,
    brightMagenta: theme.colors.brightMagenta,
    brightCyan: theme.colors.brightCyan,
    brightWhite: theme.colors.brightWhite,
  };
}

export function TerminalView({ terminalId }: TerminalViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  const { writeToTerminal, resizeTerminal, outputBuffers } = useTerminalStore();
  const { getTerminalTheme } = useThemeStore();
  const theme = getTerminalTheme(terminalId);

  const handleResize = useCallback(() => {
    if (fitAddonRef.current && terminalRef.current) {
      try {
        fitAddonRef.current.fit();
        const { cols, rows } = terminalRef.current;
        resizeTerminal(terminalId, { cols, rows });
      } catch {
        // Terminal not ready yet
      }
    }
  }, [terminalId, resizeTerminal]);

  useEffect(() => {
    if (!containerRef.current) return;

    const terminal = new Terminal({
      theme: themeToXtermTheme(theme),
      fontFamily: theme.font.family,
      fontSize: theme.font.size,
      lineHeight: theme.font.lineHeight,
      cursorBlink: true,
      cursorStyle: 'block',
      allowProposedApi: true,
      scrollback: 10000,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);

    terminal.open(containerRef.current);

    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Initial fit
    setTimeout(() => {
      handleResize();
    }, 0);

    // Handle input
    terminal.onData((data) => {
      writeToTerminal(terminalId, data);
    });

    // Window resize handler
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      terminal.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null;
    };
  }, [terminalId]);

  // Update theme
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.options.theme = themeToXtermTheme(theme);
      terminalRef.current.options.fontFamily = theme.font.family;
      terminalRef.current.options.fontSize = theme.font.size;
      terminalRef.current.options.lineHeight = theme.font.lineHeight;
    }
  }, [theme]);

  // Handle output
  useEffect(() => {
    const buffer = outputBuffers[terminalId];
    if (buffer && buffer.length > 0 && terminalRef.current) {
      const lastOutput = buffer[buffer.length - 1];
      terminalRef.current.write(lastOutput);
    }
  }, [terminalId, outputBuffers]);

  return (
    <div className="terminal-view" ref={containerRef} />
  );
}

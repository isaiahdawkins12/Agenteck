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
  const lastWrittenIndexRef = useRef<number>(-1);
  const isInitializedRef = useRef<boolean>(false);
  const hasInitialFitRef = useRef<boolean>(false);

  const { writeToTerminal, resizeTerminal, outputBuffers } = useTerminalStore();
  const { getTerminalTheme } = useThemeStore();
  const theme = getTerminalTheme(terminalId);

  const handleResize = useCallback(() => {
    if (fitAddonRef.current && terminalRef.current) {
      try {
        fitAddonRef.current.fit();
        const { cols, rows } = terminalRef.current;
        console.log(`Terminal ${terminalId} resized to ${cols}x${rows}`);
        resizeTerminal(terminalId, { cols, rows });
      } catch (e) {
        console.error('Terminal resize failed:', e);
      }
    }
  }, [terminalId, resizeTerminal]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Prevent double initialization in React StrictMode
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    const container = containerRef.current;

    // Create terminal but DON'T call fit() yet - wait for proper dimensions
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

    terminal.open(container);

    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Use ResizeObserver to detect when container has proper dimensions
    // This fires AFTER the browser has completed layout calculations
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;

      if (width > 50 && height > 50) {
        if (!hasInitialFitRef.current) {
          // Container has proper dimensions - now we can fit for the first time
          hasInitialFitRef.current = true;
          console.log(`Terminal ${terminalId} container ready, performing initial fit`);
          handleResize();

          // Write any buffered output that arrived before terminal was ready
          const buffer = outputBuffers[terminalId];
          if (buffer && buffer.length > 0) {
            console.log(`Writing ${buffer.length} buffered items to terminal ${terminalId}`);
            for (const item of buffer) {
              terminal.write(item);
            }
            lastWrittenIndexRef.current = buffer.length - 1;
          }
        } else {
          // Already initialized, just handle the resize
          handleResize();
        }
      }
    });

    resizeObserver.observe(container);

    // Handle input
    terminal.onData((data) => {
      console.log(`Terminal ${terminalId} sending input: ${data.length} chars`);
      writeToTerminal(terminalId, data);
    });

    return () => {
      resizeObserver.disconnect();
      terminal.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null;
      isInitializedRef.current = false;
      hasInitialFitRef.current = false;
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

  // Handle output - write all new buffer items since last write
  useEffect(() => {
    const buffer = outputBuffers[terminalId];
    if (buffer && buffer.length > 0) {
      const newItems = buffer.length - 1 - lastWrittenIndexRef.current;
      if (newItems > 0) {
        console.log(`Terminal ${terminalId} has ${newItems} new output items, terminal ready: ${!!terminalRef.current}`);
      }
      if (terminalRef.current) {
        // Write all items from lastWrittenIndex+1 to the end
        for (let i = lastWrittenIndexRef.current + 1; i < buffer.length; i++) {
          terminalRef.current.write(buffer[i]);
        }
        lastWrittenIndexRef.current = buffer.length - 1;
      }
    }
  }, [terminalId, outputBuffers]);

  return (
    <div className="terminal-view" ref={containerRef} />
  );
}

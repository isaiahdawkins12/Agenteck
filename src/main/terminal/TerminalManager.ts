import { BrowserWindow } from 'electron';
import { TerminalProcess } from './TerminalProcess';
import type { TerminalSession, TerminalCreateOptions, TerminalSize } from '../../shared/types';
import { IPC_CHANNELS } from '../../shared/constants';

export class TerminalManager {
  private terminals: Map<string, TerminalProcess> = new Map();
  private windowGetter: (() => BrowserWindow | null) | null = null;

  public setWindowGetter(getter: () => BrowserWindow | null): void {
    this.windowGetter = getter;
  }

  private getWindow(): BrowserWindow | null {
    return this.windowGetter?.() || null;
  }

  public create(options: TerminalCreateOptions = {}): TerminalSession {
    const terminal = new TerminalProcess(options);

    terminal.onData((data) => {
      this.sendToRenderer(IPC_CHANNELS.TERMINAL.OUTPUT, {
        id: terminal.id,
        data,
      });
    });

    terminal.onExit((code) => {
      this.sendToRenderer(IPC_CHANNELS.TERMINAL.EXIT, {
        id: terminal.id,
        code,
      });
    });

    terminal.onTitle((title) => {
      this.sendToRenderer(IPC_CHANNELS.TERMINAL.TITLE, {
        id: terminal.id,
        title,
      });
    });

    this.terminals.set(terminal.id, terminal);
    return terminal.session;
  }

  public write(id: string, data: string): void {
    const terminal = this.terminals.get(id);
    terminal?.write(data);
  }

  public resize(id: string, size: TerminalSize): void {
    const terminal = this.terminals.get(id);
    terminal?.resize(size);
  }

  public kill(id: string): void {
    const terminal = this.terminals.get(id);
    if (terminal) {
      terminal.kill();
      this.terminals.delete(id);
    }
  }

  public killAll(): void {
    for (const terminal of this.terminals.values()) {
      terminal.kill();
    }
    this.terminals.clear();
  }

  public get(id: string): TerminalSession | null {
    return this.terminals.get(id)?.session || null;
  }

  public getAll(): TerminalSession[] {
    return Array.from(this.terminals.values()).map((t) => t.session);
  }

  public has(id: string): boolean {
    return this.terminals.has(id);
  }

  public get count(): number {
    return this.terminals.size;
  }

  private sendToRenderer(channel: string, data: unknown): void {
    const window = this.getWindow();
    if (window && !window.isDestroyed()) {
      window.webContents.send(channel, data);
    }
  }
}

import * as pty from 'node-pty';
import { v4 as uuidv4 } from 'uuid';
import type { TerminalSession, TerminalCreateOptions, ShellType, TerminalSize } from '../../shared/types';
import { SHELL_CONFIGS, DEFAULT_SHELL } from '../../shared/constants';

export class TerminalProcess {
  public readonly id: string;
  public readonly session: TerminalSession;
  private ptyProcess: pty.IPty | null = null;
  private onDataCallback: ((data: string) => void) | null = null;
  private onExitCallback: ((code: number) => void) | null = null;
  private onTitleCallback: ((title: string) => void) | null = null;

  constructor(options: TerminalCreateOptions = {}) {
    this.id = uuidv4();

    const shellType = options.shellType || DEFAULT_SHELL;
    const shellConfig = SHELL_CONFIGS[shellType];

    this.session = {
      id: this.id,
      title: options.title || this.getDefaultTitle(shellType),
      shellType,
      cwd: options.cwd || process.cwd(),
      command: options.command,
      args: options.args,
      env: options.env,
      themeId: options.themeId || 'default-dark',
      status: 'running',
      createdAt: Date.now(),
    };

    this.spawn(shellConfig, options);
  }

  private getDefaultTitle(shellType: ShellType): string {
    const config = SHELL_CONFIGS[shellType];
    return config?.name || shellType;
  }

  private spawn(shellConfig: typeof SHELL_CONFIGS[string], options: TerminalCreateOptions): void {
    let shell: string;
    let args: string[];

    if (options.command) {
      // Launching a specific command/agent
      if (process.platform === 'win32') {
        // On Windows, run commands through cmd.exe to properly resolve .cmd/.bat scripts
        // This handles npm-installed CLI tools like 'claude', 'aider', etc.
        shell = 'cmd.exe';
        const fullCommand = options.args && options.args.length > 0
          ? `${options.command} ${options.args.join(' ')}`
          : options.command;
        args = ['/c', fullCommand];
      } else {
        shell = options.command;
        args = options.args || [];
      }
    } else {
      // Starting a shell
      shell = shellConfig?.path || this.getDefaultShellPath();
      args = shellConfig?.args || [];
    }

    // Ensure shell is not empty
    if (!shell) {
      shell = this.getDefaultShellPath();
    }

    console.log('Spawning terminal:', { shell, args, cwd: this.session.cwd });

    const env = {
      ...process.env,
      ...options.env,
      TERM: 'xterm-256color',
      COLORTERM: 'truecolor',
    };

    try {
      this.ptyProcess = pty.spawn(shell, args, {
        name: 'xterm-256color',
        cols: 80,
        rows: 24,
        cwd: this.session.cwd,
        env: env as Record<string, string>,
        // Use WinPTY backend on Windows - ConPTY has issues with Electron
        useConpty: false,
      });

      this.ptyProcess.onData((data: string) => {
        this.onDataCallback?.(data);
      });

      this.ptyProcess.onExit(({ exitCode }) => {
        this.session.status = 'exited';
        this.session.exitCode = exitCode;
        this.onExitCallback?.(exitCode);
      });

      if (process.platform !== 'win32') {
        this.ptyProcess.onData((data: string) => {
          const titleMatch = data.match(/\x1b]0;(.+?)\x07/);
          if (titleMatch) {
            this.session.title = titleMatch[1];
            this.onTitleCallback?.(titleMatch[1]);
          }
        });
      }
    } catch (error) {
      this.session.status = 'error';
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Failed to spawn terminal:', { shell, args, error: errorMessage });
      throw new Error(`Failed to spawn "${shell}": ${errorMessage}`);
    }
  }

  private getDefaultShellPath(): string {
    if (process.platform === 'win32') {
      return process.env.COMSPEC || 'cmd.exe';
    }
    return process.env.SHELL || '/bin/bash';
  }

  public write(data: string): void {
    this.ptyProcess?.write(data);
  }

  public resize(size: TerminalSize): void {
    if (this.ptyProcess && size.cols > 0 && size.rows > 0) {
      this.ptyProcess.resize(size.cols, size.rows);
    }
  }

  public kill(): void {
    if (this.ptyProcess) {
      this.ptyProcess.kill();
      this.ptyProcess = null;
    }
  }

  public onData(callback: (data: string) => void): void {
    this.onDataCallback = callback;
  }

  public onExit(callback: (code: number) => void): void {
    this.onExitCallback = callback;
  }

  public onTitle(callback: (title: string) => void): void {
    this.onTitleCallback = callback;
  }

  public get isRunning(): boolean {
    return this.session.status === 'running';
  }
}

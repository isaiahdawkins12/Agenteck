import * as pty from 'node-pty';
import * as os from 'os';
import { execSync } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import type { TerminalSession, TerminalCreateOptions, ShellType, TerminalSize } from '../../shared/types';
import { SHELL_CONFIGS, DEFAULT_SHELL } from '../../shared/constants';

// Cache for user PATH from registry (Windows only)
let cachedUserPath: string | null = null;

/**
 * On Windows, Electron often doesn't inherit the full user PATH when launched from
 * Explorer or VS Code. This function reads the user's PATH directly from the registry
 * to ensure CLI tools installed via npm, WinGet, etc. are available.
 */
function getWindowsUserPath(): string {
  if (process.platform !== 'win32') return '';

  if (cachedUserPath !== null) return cachedUserPath;

  try {
    cachedUserPath = execSync(
      'powershell.exe -NoProfile -Command "[Environment]::GetEnvironmentVariable(\'Path\', \'User\')"',
      { encoding: 'utf8', timeout: 5000 }
    ).trim();
    return cachedUserPath;
  } catch {
    cachedUserPath = '';
    return '';
  }
}

/**
 * Merges the user's PATH from the registry with the current process PATH,
 * ensuring tools installed to user-specific locations are available.
 */
function getEnhancedPath(): string {
  const currentPath = process.env.PATH || process.env.Path || '';

  if (process.platform !== 'win32') return currentPath;

  const userPath = getWindowsUserPath();
  if (!userPath) return currentPath;

  // Merge paths, avoiding duplicates
  const currentPaths = new Set(currentPath.split(';').map(p => p.toLowerCase()));
  const newPaths: string[] = [];

  for (const p of userPath.split(';')) {
    if (p && !currentPaths.has(p.toLowerCase())) {
      newPaths.push(p);
    }
  }

  return newPaths.length > 0 ? `${currentPath};${newPaths.join(';')}` : currentPath;
}

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
      cwd: options.cwd || os.homedir(),
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
      const fullCommand = options.args && options.args.length > 0
        ? `${options.command} ${options.args.join(' ')}`
        : options.command;

      if (process.platform === 'win32') {
        // On Windows, use the configured agent shell (PowerShell or cmd.exe)
        const agentShell = options.agentShell || 'powershell';
        if (agentShell === 'powershell') {
          // Use PowerShell to run the command
          // IMPORTANT:
          // 1. Load the user's profile to get PATH additions from npm, WinGet, etc.
          // 2. Explicitly Set-Location to the cwd because -Command doesn't respect PTY cwd
          shell = 'powershell.exe';
          const targetDir = this.session.cwd.replace(/'/g, "''"); // Escape single quotes for PS
          const wrappedCommand = `& { if (Test-Path $PROFILE) { . $PROFILE 2>$null }; Set-Location -LiteralPath '${targetDir}'; ${fullCommand} }`;
          args = ['-NoExit', '-Command', wrappedCommand];
        } else {
          // Fall back to cmd.exe for users who prefer it
          shell = 'cmd.exe';
          args = ['/c', fullCommand];
        }
      } else {
        // On Linux/macOS, use the configured shell (bash, zsh, etc.)
        const agentShell = options.agentShell || 'bash';
        const shellPath = SHELL_CONFIGS[agentShell]?.path || '/bin/bash';
        shell = shellPath;
        // Use -l for login shell (loads profile), -c to run command
        args = ['-l', '-c', fullCommand];
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

    // Build environment with enhanced PATH for Windows
    // This ensures tools installed via npm, WinGet, etc. are available even when
    // Electron was launched without inheriting the full user PATH
    const enhancedPath = getEnhancedPath();
    const env = {
      ...process.env,
      ...options.env,
      PATH: enhancedPath,
      Path: enhancedPath, // Windows uses 'Path' sometimes
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
          // Match OSC title sequence: ESC ] 0 ; title BEL
          // eslint-disable-next-line no-control-regex
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

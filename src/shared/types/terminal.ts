export type ShellType = 'powershell' | 'cmd' | 'bash' | 'zsh' | 'wsl' | 'custom';

export type TerminalStatus = 'running' | 'exited' | 'error';

export interface TerminalSession {
  id: string;
  title: string;
  shellType: ShellType;
  cwd: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  themeId: string;
  status: TerminalStatus;
  exitCode?: number;
  createdAt: number;
}

export interface TerminalCreateOptions {
  shellType?: ShellType;
  cwd?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  themeId?: string;
  title?: string;
}

export interface ShellInfo {
  id: ShellType;
  name: string;
  path: string;
  args?: string[];
  available: boolean;
}

export interface TerminalSize {
  cols: number;
  rows: number;
}

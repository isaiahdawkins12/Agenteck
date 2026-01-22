export interface StartupTerminalConfig {
  agentId: string;
  cwd: string;
}

export interface StartupConfig {
  terminals: StartupTerminalConfig[];
}

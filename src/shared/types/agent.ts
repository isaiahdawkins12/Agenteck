export interface AgentPreset {
  id: string;
  name: string;
  command: string;
  args: string[];
  icon?: string;
  defaultThemeId?: string;
  description?: string;
  website?: string;
  isBuiltIn?: boolean;
}

export interface AgentInstance {
  id: string;
  presetId: string;
  terminalId: string;
  status: 'starting' | 'running' | 'stopped' | 'error';
  startedAt: number;
  error?: string;
}

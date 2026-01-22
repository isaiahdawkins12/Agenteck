import Store from 'electron-store';
import type { Workspace, AgentRecentDirectories, AgentPreset } from '../../shared/types';
import { BUILT_IN_THEMES } from '../../shared/constants';

interface StoreSchema {
  workspace: Workspace | null;
  recentWorkspaces: Array<{ id: string; name: string; path?: string; lastOpened: number }>;
  themes: typeof BUILT_IN_THEMES;
  agents: AgentPreset[];
  agentRecentDirectories: AgentRecentDirectories;
  settings: {
    defaultShell: string;
    defaultTheme: string;
    fontSize: number;
    fontFamily: string;
    autoSave: boolean;
    autoSaveInterval: number;
    /** Shell used to launch agent commands. Defaults to PowerShell on Windows, bash on Linux/macOS */
    agentShell: string;
  };
  windowState: {
    width: number;
    height: number;
    x?: number;
    y?: number;
    isMaximized: boolean;
  };
}

const defaultSettings: StoreSchema['settings'] = {
  defaultShell: 'powershell',
  defaultTheme: 'default-dark',
  fontSize: 14,
  fontFamily: '"Cascadia Code", "JetBrains Mono", "Fira Code", Consolas, monospace',
  autoSave: true,
  autoSaveInterval: 30000,
  agentShell: process.platform === 'win32' ? 'powershell' : 'bash',
};

const defaultWindowState: StoreSchema['windowState'] = {
  width: 1400,
  height: 900,
  isMaximized: false,
};

export class ConfigStore {
  private store: Store<StoreSchema>;

  constructor() {
    this.store = new Store<StoreSchema>({
      name: 'agenteck-config',
      defaults: {
        workspace: null,
        recentWorkspaces: [],
        themes: BUILT_IN_THEMES,
        agents: [],
        agentRecentDirectories: {},
        settings: defaultSettings,
        windowState: defaultWindowState,
      },
    });
  }

  public get<K extends keyof StoreSchema>(key: K): StoreSchema[K] {
    return this.store.get(key);
  }

  public set<K extends keyof StoreSchema>(key: K, value: StoreSchema[K]): void {
    this.store.set(key, value);
  }

  public delete<K extends keyof StoreSchema>(key: K): void {
    this.store.delete(key);
  }

  public getPath(key: string): unknown {
    return this.store.get(key);
  }

  public setPath(key: string, value: unknown): void {
    this.store.set(key, value);
  }

  public deletePath(key: string): void {
    this.store.delete(key as keyof StoreSchema);
  }

  public getWorkspace(): Workspace | null {
    return this.store.get('workspace');
  }

  public saveWorkspace(workspace: Workspace): void {
    workspace.updatedAt = Date.now();
    this.store.set('workspace', workspace);

    const recentWorkspaces = this.store.get('recentWorkspaces');
    const existingIndex = recentWorkspaces.findIndex((w) => w.id === workspace.id);

    if (existingIndex !== -1) {
      recentWorkspaces.splice(existingIndex, 1);
    }

    recentWorkspaces.unshift({
      id: workspace.id,
      name: workspace.name,
      lastOpened: Date.now(),
    });

    if (recentWorkspaces.length > 10) {
      recentWorkspaces.pop();
    }

    this.store.set('recentWorkspaces', recentWorkspaces);
  }

  public getSettings(): StoreSchema['settings'] {
    return this.store.get('settings');
  }

  public updateSettings(updates: Partial<StoreSchema['settings']>): void {
    const current = this.store.get('settings');
    this.store.set('settings', { ...current, ...updates });
  }

  public getWindowState(): StoreSchema['windowState'] {
    return this.store.get('windowState');
  }

  public saveWindowState(state: Partial<StoreSchema['windowState']>): void {
    const current = this.store.get('windowState');
    this.store.set('windowState', { ...current, ...state });
  }

  public getAllThemes(): typeof BUILT_IN_THEMES {
    return this.store.get('themes');
  }

  public getAllAgents(): AgentPreset[] {
    return this.store.get('agents');
  }

  public addAgent(agent: AgentPreset): void {
    const agents = this.store.get('agents');
    // Don't add if already exists
    if (agents.some((a) => a.id === agent.id)) {
      return;
    }
    agents.push(agent);
    this.store.set('agents', agents);
  }

  public removeAgent(agentId: string): void {
    const agents = this.store.get('agents');
    this.store.set('agents', agents.filter((a) => a.id !== agentId));
  }

  public updateAgent(agentId: string, updates: Partial<AgentPreset>): void {
    const agents = this.store.get('agents');
    const index = agents.findIndex((a) => a.id === agentId);
    if (index !== -1) {
      agents[index] = { ...agents[index], ...updates };
      this.store.set('agents', agents);
    }
  }

  public getAgentRecentDirectories(): AgentRecentDirectories {
    return this.store.get('agentRecentDirectories');
  }

  public getRecentDirectoriesForAgent(agentId: string): string[] {
    const all = this.store.get('agentRecentDirectories');
    return all[agentId] || [];
  }

  public addRecentDirectoryForAgent(agentId: string, directory: string, maxRecent: number = 10): void {
    const all = this.store.get('agentRecentDirectories');
    const agentDirs = all[agentId] || [];

    // Remove if already exists to avoid duplicates
    const filtered = agentDirs.filter((d) => d !== directory);

    // Add to front of list
    filtered.unshift(directory);

    // Trim to max size
    if (filtered.length > maxRecent) {
      filtered.pop();
    }

    all[agentId] = filtered;
    this.store.set('agentRecentDirectories', all);
  }

  public removeRecentDirectoryForAgent(agentId: string, directory: string): void {
    const all = this.store.get('agentRecentDirectories');
    const agentDirs = all[agentId] || [];
    all[agentId] = agentDirs.filter((d) => d !== directory);
    this.store.set('agentRecentDirectories', all);
  }

  public clearRecentDirectoriesForAgent(agentId: string): void {
    const all = this.store.get('agentRecentDirectories');
    delete all[agentId];
    this.store.set('agentRecentDirectories', all);
  }

  public clear(): void {
    this.store.clear();
  }
}

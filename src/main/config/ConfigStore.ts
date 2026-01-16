import Store from 'electron-store';
import type { Workspace } from '../../shared/types';
import { BUILT_IN_THEMES, DEFAULT_AGENTS } from '../../shared/constants';

interface StoreSchema {
  workspace: Workspace | null;
  recentWorkspaces: Array<{ id: string; name: string; path?: string; lastOpened: number }>;
  themes: typeof BUILT_IN_THEMES;
  agents: typeof DEFAULT_AGENTS;
  settings: {
    defaultShell: string;
    defaultTheme: string;
    fontSize: number;
    fontFamily: string;
    autoSave: boolean;
    autoSaveInterval: number;
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
        agents: DEFAULT_AGENTS,
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

  public getAllAgents(): typeof DEFAULT_AGENTS {
    return this.store.get('agents');
  }

  public clear(): void {
    this.store.clear();
  }
}

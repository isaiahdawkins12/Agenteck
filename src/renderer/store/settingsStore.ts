import { create } from 'zustand';
import type { ShellType, AgentPreset, ShellInfo } from '@shared/types';
import { DEFAULT_AGENTS, IPC_CHANNELS } from '@shared/constants';

interface SettingsState {
  defaultShell: ShellType;
  availableShells: ShellInfo[];
  agents: AgentPreset[];
  sidebarCollapsed: boolean;
  autoSave: boolean;
  autoSaveInterval: number;
  isMaximized: boolean;
}

interface SettingsActions {
  setDefaultShell: (shell: ShellType) => void;
  loadAvailableShells: () => Promise<void>;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setAutoSave: (enabled: boolean) => void;
  setAutoSaveInterval: (interval: number) => void;
  addAgent: (agent: AgentPreset) => void;
  updateAgent: (agentId: string, updates: Partial<AgentPreset>) => void;
  deleteAgent: (agentId: string) => void;
  setIsMaximized: (isMaximized: boolean) => void;
  initializeWindowListeners: () => () => void;
}

type SettingsStore = SettingsState & SettingsActions;

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  defaultShell: 'powershell',
  availableShells: [],
  agents: DEFAULT_AGENTS,
  sidebarCollapsed: false,
  autoSave: true,
  autoSaveInterval: 30000,
  isMaximized: false,

  setDefaultShell: (shell) => {
    set({ defaultShell: shell });
  },

  loadAvailableShells: async () => {
    try {
      const shells = await window.electronAPI.invoke(
        IPC_CHANNELS.APP.GET_SHELLS
      ) as ShellInfo[];
      set({ availableShells: shells });
    } catch (error) {
      console.error('Failed to load available shells:', error);
    }
  },

  setSidebarCollapsed: (collapsed) => {
    set({ sidebarCollapsed: collapsed });
  },

  toggleSidebar: () => {
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
  },

  setAutoSave: (enabled) => {
    set({ autoSave: enabled });
  },

  setAutoSaveInterval: (interval) => {
    set({ autoSaveInterval: interval });
  },

  addAgent: (agent) => {
    set((state) => ({
      agents: [...state.agents, { ...agent, isBuiltIn: false }],
    }));
  },

  updateAgent: (agentId, updates) => {
    set((state) => ({
      agents: state.agents.map((a) =>
        a.id === agentId ? { ...a, ...updates } : a
      ),
    }));
  },

  deleteAgent: (agentId) => {
    set((state) => {
      const agent = state.agents.find((a) => a.id === agentId);
      if (agent?.isBuiltIn) return state;
      return {
        agents: state.agents.filter((a) => a.id !== agentId),
      };
    });
  },

  setIsMaximized: (isMaximized) => {
    set({ isMaximized });
  },

  initializeWindowListeners: () => {
    const checkMaximized = async () => {
      const isMaximized = await window.electronAPI.invoke(
        IPC_CHANNELS.APP.IS_MAXIMIZED
      ) as boolean;
      get().setIsMaximized(isMaximized);
    };

    checkMaximized();

    const unsub = window.electronAPI.on(
      IPC_CHANNELS.APP.MAXIMIZED,
      (data: { isMaximized: boolean }) => {
        get().setIsMaximized(data.isMaximized);
      }
    );

    return unsub;
  },
}));

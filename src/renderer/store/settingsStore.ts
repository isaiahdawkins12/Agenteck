import { create } from 'zustand';
import type { ShellType, AgentPreset, ShellInfo, AgentRecentDirectories } from '@shared/types';
import { IPC_CHANNELS } from '@shared/constants';

interface SettingsState {
  defaultShell: ShellType;
  availableShells: ShellInfo[];
  agents: AgentPreset[];
  agentRecentDirectories: AgentRecentDirectories;
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
  loadRecentDirectories: (agentId: string) => Promise<string[]>;
  addRecentDirectory: (agentId: string, directory: string) => Promise<void>;
  removeRecentDirectory: (agentId: string, directory: string) => Promise<void>;
  clearRecentDirectories: (agentId: string) => Promise<void>;
  selectDirectory: () => Promise<string | null>;
  setAgentDefaultCwd: (agentId: string, cwd: string | undefined) => void;
}

type SettingsStore = SettingsState & SettingsActions;

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  defaultShell: 'powershell',
  availableShells: [],
  agents: [],
  agentRecentDirectories: {},
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

  loadRecentDirectories: async (agentId) => {
    try {
      const directories = await window.electronAPI.invoke(
        IPC_CHANNELS.AGENT.GET_RECENT_DIRECTORIES,
        agentId
      ) as string[];
      set((state) => ({
        agentRecentDirectories: {
          ...state.agentRecentDirectories,
          [agentId]: directories,
        },
      }));
      return directories;
    } catch (error) {
      console.error('Failed to load recent directories:', error);
      return [];
    }
  },

  addRecentDirectory: async (agentId, directory) => {
    try {
      await window.electronAPI.invoke(
        IPC_CHANNELS.AGENT.ADD_RECENT_DIRECTORY,
        agentId,
        directory
      );
      // Update local state
      set((state) => {
        const current = state.agentRecentDirectories[agentId] || [];
        const filtered = current.filter((d) => d !== directory);
        filtered.unshift(directory);
        if (filtered.length > 10) filtered.pop();
        return {
          agentRecentDirectories: {
            ...state.agentRecentDirectories,
            [agentId]: filtered,
          },
        };
      });
    } catch (error) {
      console.error('Failed to add recent directory:', error);
    }
  },

  removeRecentDirectory: async (agentId, directory) => {
    try {
      await window.electronAPI.invoke(
        IPC_CHANNELS.AGENT.REMOVE_RECENT_DIRECTORY,
        agentId,
        directory
      );
      set((state) => ({
        agentRecentDirectories: {
          ...state.agentRecentDirectories,
          [agentId]: (state.agentRecentDirectories[agentId] || []).filter(
            (d) => d !== directory
          ),
        },
      }));
    } catch (error) {
      console.error('Failed to remove recent directory:', error);
    }
  },

  clearRecentDirectories: async (agentId) => {
    try {
      await window.electronAPI.invoke(
        IPC_CHANNELS.AGENT.CLEAR_RECENT_DIRECTORIES,
        agentId
      );
      set((state) => {
        const newDirs = { ...state.agentRecentDirectories };
        delete newDirs[agentId];
        return { agentRecentDirectories: newDirs };
      });
    } catch (error) {
      console.error('Failed to clear recent directories:', error);
    }
  },

  selectDirectory: async () => {
    try {
      const directory = await window.electronAPI.invoke(
        IPC_CHANNELS.AGENT.SELECT_DIRECTORY
      ) as string | null;
      return directory;
    } catch (error) {
      console.error('Failed to select directory:', error);
      return null;
    }
  },

  setAgentDefaultCwd: (agentId, cwd) => {
    set((state) => ({
      agents: state.agents.map((a) =>
        a.id === agentId ? { ...a, defaultCwd: cwd } : a
      ),
    }));
  },
}));

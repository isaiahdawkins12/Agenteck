import { create } from 'zustand';
import type { ShellType, AgentPreset, ShellInfo, AgentRecentDirectories } from '@shared/types';
import { IPC_CHANNELS } from '@shared/constants';

interface SettingsState {
  defaultShell: ShellType;
  agentShell: ShellType;
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
  setAgentShell: (shell: ShellType) => void;
  loadAvailableShells: () => Promise<void>;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setAutoSave: (enabled: boolean) => void;
  setAutoSaveInterval: (interval: number) => void;
  loadAgents: () => Promise<void>;
  addAgent: (agent: AgentPreset) => Promise<void>;
  updateAgent: (agentId: string, updates: Partial<AgentPreset>) => Promise<void>;
  deleteAgent: (agentId: string) => Promise<void>;
  setIsMaximized: (isMaximized: boolean) => void;
  initializeWindowListeners: () => () => void;
  loadRecentDirectories: (agentId: string) => Promise<string[]>;
  addRecentDirectory: (agentId: string, directory: string) => Promise<void>;
  removeRecentDirectory: (agentId: string, directory: string) => Promise<void>;
  clearRecentDirectories: (agentId: string) => Promise<void>;
  selectDirectory: () => Promise<string | null>;
  setAgentDefaultCwd: (agentId: string, cwd: string | undefined) => Promise<void>;
}

type SettingsStore = SettingsState & SettingsActions;

// Detect platform for default agent shell
const getDefaultAgentShell = (): ShellType => {
  // In renderer, we can check navigator.platform
  const isWindows = typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('win');
  return isWindows ? 'powershell' : 'bash';
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  defaultShell: 'powershell',
  agentShell: getDefaultAgentShell(),
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

  setAgentShell: (shell) => {
    set({ agentShell: shell });
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

  loadAgents: async () => {
    try {
      const agents = await window.electronAPI.invoke(
        IPC_CHANNELS.AGENT.GET_ALL
      ) as AgentPreset[];
      set({ agents });
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  },

  addAgent: async (agent) => {
    try {
      const agents = await window.electronAPI.invoke(
        IPC_CHANNELS.AGENT.ADD,
        agent
      ) as AgentPreset[];
      set({ agents });
    } catch (error) {
      console.error('Failed to add agent:', error);
    }
  },

  updateAgent: async (agentId, updates) => {
    try {
      const agents = await window.electronAPI.invoke(
        IPC_CHANNELS.AGENT.UPDATE,
        agentId,
        updates
      ) as AgentPreset[];
      set({ agents });
    } catch (error) {
      console.error('Failed to update agent:', error);
    }
  },

  deleteAgent: async (agentId) => {
    try {
      const agents = await window.electronAPI.invoke(
        IPC_CHANNELS.AGENT.REMOVE,
        agentId
      ) as AgentPreset[];
      set({ agents });
    } catch (error) {
      console.error('Failed to delete agent:', error);
    }
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

  setAgentDefaultCwd: async (agentId, cwd) => {
    try {
      const agents = await window.electronAPI.invoke(
        IPC_CHANNELS.AGENT.UPDATE,
        agentId,
        { defaultCwd: cwd }
      ) as AgentPreset[];
      set({ agents });
    } catch (error) {
      console.error('Failed to set agent default cwd:', error);
    }
  },
}));

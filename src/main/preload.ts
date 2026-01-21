import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { IPC_CHANNELS } from '../shared/constants';
import { GitIpcChannels } from '../shared/types/git';

type Callback = (data: unknown) => void;

const validInvokeChannels: readonly string[] = [
  IPC_CHANNELS.TERMINAL.CREATE,
  IPC_CHANNELS.TERMINAL.WRITE,
  IPC_CHANNELS.TERMINAL.RESIZE,
  IPC_CHANNELS.TERMINAL.KILL,
  IPC_CHANNELS.TERMINAL.GET_ALL,
  IPC_CHANNELS.TERMINAL.GET,
  IPC_CHANNELS.CONFIG.GET,
  IPC_CHANNELS.CONFIG.SET,
  IPC_CHANNELS.CONFIG.DELETE,
  IPC_CHANNELS.CONFIG.GET_WORKSPACE,
  IPC_CHANNELS.CONFIG.SAVE_WORKSPACE,
  IPC_CHANNELS.AGENT.GET_ALL,
  IPC_CHANNELS.AGENT.ADD,
  IPC_CHANNELS.AGENT.REMOVE,
  IPC_CHANNELS.AGENT.UPDATE,
  IPC_CHANNELS.AGENT.GET_RECENT_DIRECTORIES,
  IPC_CHANNELS.AGENT.ADD_RECENT_DIRECTORY,
  IPC_CHANNELS.AGENT.REMOVE_RECENT_DIRECTORY,
  IPC_CHANNELS.AGENT.CLEAR_RECENT_DIRECTORIES,
  IPC_CHANNELS.AGENT.SELECT_DIRECTORY,
  IPC_CHANNELS.APP.GET_SHELLS,
  IPC_CHANNELS.APP.MINIMIZE,
  IPC_CHANNELS.APP.MAXIMIZE,
  IPC_CHANNELS.APP.CLOSE,
  IPC_CHANNELS.APP.IS_MAXIMIZED,
  // Theme channels
  IPC_CHANNELS.THEME.EXPORT,
  IPC_CHANNELS.THEME.IMPORT,
  // Git channels
  GitIpcChannels.DETECT_REPO,
  GitIpcChannels.GET_STATUS,
  GitIpcChannels.GET_REPOSITORY,
  GitIpcChannels.LIST_WORKTREES,
  GitIpcChannels.LIST_BRANCHES,
  GitIpcChannels.CREATE_WORKTREE,
  GitIpcChannels.REMOVE_WORKTREE,
  GitIpcChannels.REFRESH,
];

const validEventChannels: readonly string[] = [
  IPC_CHANNELS.TERMINAL.OUTPUT,
  IPC_CHANNELS.TERMINAL.EXIT,
  IPC_CHANNELS.TERMINAL.TITLE,
  IPC_CHANNELS.APP.MAXIMIZED,
];

const electronAPI = {
  invoke: async (channel: string, ...args: unknown[]): Promise<unknown> => {
    if (validInvokeChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
    throw new Error(`Invalid channel: ${channel}`);
  },

  on: (channel: string, callback: Callback): (() => void) => {
    if (validEventChannels.includes(channel)) {
      const subscription = (_event: IpcRendererEvent, data: unknown) => callback(data);
      ipcRenderer.on(channel, subscription);
      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    }
    throw new Error(`Invalid channel: ${channel}`);
  },

  off: (channel: string, callback: Callback): void => {
    if (validEventChannels.includes(channel)) {
      ipcRenderer.removeListener(channel, callback as (...args: unknown[]) => void);
    }
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

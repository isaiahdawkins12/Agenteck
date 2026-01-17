import type { TerminalSession, TerminalCreateOptions, TerminalSize, ShellInfo } from './terminal';
import type { Workspace } from './workspace';

export interface IpcChannels {
  // Terminal channels
  'terminal:create': (options: TerminalCreateOptions) => Promise<TerminalSession>;
  'terminal:write': (id: string, data: string) => Promise<void>;
  'terminal:resize': (id: string, size: TerminalSize) => Promise<void>;
  'terminal:kill': (id: string) => Promise<void>;
  'terminal:getAll': () => Promise<TerminalSession[]>;
  'terminal:get': (id: string) => Promise<TerminalSession | null>;

  // Config channels
  'config:get': <T>(key: string) => Promise<T | undefined>;
  'config:set': <T>(key: string, value: T) => Promise<void>;
  'config:delete': (key: string) => Promise<void>;
  'config:getWorkspace': () => Promise<Workspace | null>;
  'config:saveWorkspace': (workspace: Workspace) => Promise<void>;

  // Agent channels
  'agent:getRecentDirectories': (agentId: string) => Promise<string[]>;
  'agent:addRecentDirectory': (agentId: string, directory: string) => Promise<void>;
  'agent:removeRecentDirectory': (agentId: string, directory: string) => Promise<void>;
  'agent:clearRecentDirectories': (agentId: string) => Promise<void>;
  'agent:selectDirectory': () => Promise<string | null>;

  // App channels
  'app:getShells': () => Promise<ShellInfo[]>;
  'app:minimize': () => Promise<void>;
  'app:maximize': () => Promise<void>;
  'app:close': () => Promise<void>;
  'app:isMaximized': () => Promise<boolean>;
}

export interface IpcEvents {
  'terminal:output': { id: string; data: string };
  'terminal:exit': { id: string; code: number };
  'terminal:title': { id: string; title: string };
  'app:maximized': { isMaximized: boolean };
}

export interface ElectronAPI {
  invoke: <K extends keyof IpcChannels>(
    channel: K,
    ...args: Parameters<IpcChannels[K]>
  ) => ReturnType<IpcChannels[K]>;
  on: <K extends keyof IpcEvents>(
    channel: K,
    callback: (data: IpcEvents[K]) => void
  ) => () => void;
  off: <K extends keyof IpcEvents>(
    channel: K,
    callback: (data: IpcEvents[K]) => void
  ) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

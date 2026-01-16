import { BrowserWindow, IpcMain } from 'electron';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import { TerminalManager } from '../terminal/TerminalManager';
import { ConfigStore } from '../config/ConfigStore';
import { IPC_CHANNELS, SHELL_CONFIGS } from '../../shared/constants';
import type { TerminalCreateOptions, TerminalSize, ShellInfo, Workspace } from '../../shared/types';

const execAsync = promisify(exec);

export function registerIpcHandlers(
  ipcMain: IpcMain,
  terminalManager: TerminalManager,
  configStore: ConfigStore,
  getWindow: () => BrowserWindow | null
): void {
  terminalManager.setWindowGetter(getWindow);

  // Terminal handlers
  ipcMain.handle(IPC_CHANNELS.TERMINAL.CREATE, async (_event, options: TerminalCreateOptions) => {
    return terminalManager.create(options);
  });

  ipcMain.handle(IPC_CHANNELS.TERMINAL.WRITE, async (_event, id: string, data: string) => {
    terminalManager.write(id, data);
  });

  ipcMain.handle(IPC_CHANNELS.TERMINAL.RESIZE, async (_event, id: string, size: TerminalSize) => {
    terminalManager.resize(id, size);
  });

  ipcMain.handle(IPC_CHANNELS.TERMINAL.KILL, async (_event, id: string) => {
    terminalManager.kill(id);
  });

  ipcMain.handle(IPC_CHANNELS.TERMINAL.GET_ALL, async () => {
    return terminalManager.getAll();
  });

  ipcMain.handle(IPC_CHANNELS.TERMINAL.GET, async (_event, id: string) => {
    return terminalManager.get(id);
  });

  // Config handlers
  ipcMain.handle(IPC_CHANNELS.CONFIG.GET, async (_event, key: string) => {
    return configStore.getPath(key);
  });

  ipcMain.handle(IPC_CHANNELS.CONFIG.SET, async (_event, key: string, value: unknown) => {
    configStore.setPath(key, value);
  });

  ipcMain.handle(IPC_CHANNELS.CONFIG.DELETE, async (_event, key: string) => {
    configStore.deletePath(key);
  });

  ipcMain.handle(IPC_CHANNELS.CONFIG.GET_WORKSPACE, async () => {
    return configStore.getWorkspace();
  });

  ipcMain.handle(IPC_CHANNELS.CONFIG.SAVE_WORKSPACE, async (_event, workspace: Workspace) => {
    configStore.saveWorkspace(workspace);
  });

  // App handlers
  ipcMain.handle(IPC_CHANNELS.APP.GET_SHELLS, async () => {
    return getAvailableShells();
  });

  ipcMain.handle(IPC_CHANNELS.APP.MINIMIZE, async () => {
    const window = getWindow();
    window?.minimize();
  });

  ipcMain.handle(IPC_CHANNELS.APP.MAXIMIZE, async () => {
    const window = getWindow();
    if (window) {
      if (window.isMaximized()) {
        window.unmaximize();
      } else {
        window.maximize();
      }
    }
  });

  ipcMain.handle(IPC_CHANNELS.APP.CLOSE, async () => {
    const window = getWindow();
    window?.close();
  });

  ipcMain.handle(IPC_CHANNELS.APP.IS_MAXIMIZED, async () => {
    const window = getWindow();
    return window?.isMaximized() ?? false;
  });
}

async function getAvailableShells(): Promise<ShellInfo[]> {
  const shells: ShellInfo[] = [];

  for (const [id, config] of Object.entries(SHELL_CONFIGS)) {
    const available = await checkShellAvailable(config.path!);
    shells.push({
      id: id as ShellInfo['id'],
      name: config.name!,
      path: config.path!,
      args: config.args,
      available,
    });
  }

  return shells;
}

async function checkShellAvailable(shellPath: string): Promise<boolean> {
  try {
    if (process.platform === 'win32') {
      await execAsync(`where ${shellPath}`);
      return true;
    } else {
      if (fs.existsSync(shellPath)) {
        return true;
      }
      await execAsync(`which ${shellPath}`);
      return true;
    }
  } catch {
    return false;
  }
}

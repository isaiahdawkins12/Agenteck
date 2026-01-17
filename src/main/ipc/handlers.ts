import { BrowserWindow, IpcMain, dialog } from 'electron';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { TerminalManager } from '../terminal/TerminalManager';
import { ConfigStore } from '../config/ConfigStore';
import { IPC_CHANNELS, SHELL_CONFIGS } from '../../shared/constants';
import type { TerminalCreateOptions, TerminalSize, ShellInfo, Workspace, ThemeConfig, TerminalColors } from '../../shared/types';

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

  // Agent directory handlers
  ipcMain.handle(IPC_CHANNELS.AGENT.GET_RECENT_DIRECTORIES, async (_event, agentId: string) => {
    return configStore.getRecentDirectoriesForAgent(agentId);
  });

  ipcMain.handle(IPC_CHANNELS.AGENT.ADD_RECENT_DIRECTORY, async (_event, agentId: string, directory: string) => {
    configStore.addRecentDirectoryForAgent(agentId, directory);
  });

  ipcMain.handle(IPC_CHANNELS.AGENT.REMOVE_RECENT_DIRECTORY, async (_event, agentId: string, directory: string) => {
    configStore.removeRecentDirectoryForAgent(agentId, directory);
  });

  ipcMain.handle(IPC_CHANNELS.AGENT.CLEAR_RECENT_DIRECTORIES, async (_event, agentId: string) => {
    configStore.clearRecentDirectoriesForAgent(agentId);
  });

  ipcMain.handle(IPC_CHANNELS.AGENT.SELECT_DIRECTORY, async () => {
    const window = getWindow();
    if (!window) return null;

    const result = await dialog.showOpenDialog(window, {
      properties: ['openDirectory'],
      title: 'Select Working Directory',
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  // Theme handlers
  ipcMain.handle(IPC_CHANNELS.THEME.EXPORT, async (_event, theme: ThemeConfig) => {
    const window = getWindow();
    if (!window) return { success: false, error: 'No window available' };

    const result = await dialog.showSaveDialog(window, {
      title: 'Export Theme',
      defaultPath: `${theme.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.json`,
      filters: [{ name: 'JSON Files', extensions: ['json'] }],
    });

    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true };
    }

    try {
      const exportData = {
        name: theme.name,
        colors: theme.colors,
        font: theme.font,
        opacity: theme.opacity,
      };
      await fs.promises.writeFile(result.filePath, JSON.stringify(exportData, null, 2), 'utf-8');
      return { success: true, filePath: result.filePath };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle(IPC_CHANNELS.THEME.IMPORT, async () => {
    const window = getWindow();
    if (!window) return { success: false, error: 'No window available' };

    const result = await dialog.showOpenDialog(window, {
      title: 'Import Themes',
      filters: [{ name: 'JSON Files', extensions: ['json'] }],
      properties: ['openFile', 'multiSelections'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    const themes: ThemeConfig[] = [];
    const errors: string[] = [];

    for (const filePath of result.filePaths) {
      try {
        const content = await fs.promises.readFile(filePath, 'utf-8');
        const data = JSON.parse(content);
        const validation = validateThemeStructure(data);

        if (!validation.valid) {
          errors.push(`${path.basename(filePath)}: ${validation.error}`);
          continue;
        }

        themes.push({
          id: `imported-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: data.name || path.basename(filePath, '.json'),
          colors: data.colors,
          font: data.font || {
            family: '"Cascadia Code", "JetBrains Mono", "Fira Code", Consolas, monospace',
            size: 14,
            lineHeight: 1.2,
          },
          opacity: data.opacity ?? 1,
          isBuiltIn: false,
          category: 'imported',
          source: path.basename(filePath),
        });
      } catch (error) {
        errors.push(`${path.basename(filePath)}: ${error instanceof Error ? error.message : 'Parse error'}`);
      }
    }

    return { success: true, themes, errors };
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

const REQUIRED_COLORS: (keyof TerminalColors)[] = [
  'background',
  'foreground',
  'cursor',
  'black',
  'red',
  'green',
  'yellow',
  'blue',
  'magenta',
  'cyan',
  'white',
  'brightBlack',
  'brightRed',
  'brightGreen',
  'brightYellow',
  'brightBlue',
  'brightMagenta',
  'brightCyan',
  'brightWhite',
];

function validateThemeStructure(data: unknown): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid theme structure' };
  }

  const theme = data as Record<string, unknown>;

  if (!theme.colors || typeof theme.colors !== 'object') {
    return { valid: false, error: 'Missing or invalid colors object' };
  }

  const colors = theme.colors as Record<string, unknown>;

  for (const colorKey of REQUIRED_COLORS) {
    if (typeof colors[colorKey] !== 'string') {
      return { valid: false, error: `Missing or invalid color: ${colorKey}` };
    }

    const colorValue = colors[colorKey] as string;
    if (!/^#[0-9a-fA-F]{6}$/.test(colorValue)) {
      return { valid: false, error: `Invalid hex color for ${colorKey}: ${colorValue}` };
    }
  }

  return { valid: true };
}

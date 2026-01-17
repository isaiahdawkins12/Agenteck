import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'path';
import { TerminalManager } from './terminal/TerminalManager';
import { ConfigStore } from './config/ConfigStore';
import { registerIpcHandlers } from './ipc/handlers';
import { registerGitIpcHandlers } from './git';

let mainWindow: BrowserWindow | null = null;
let terminalManager: TerminalManager | null = null;
let configStore: ConfigStore | null = null;

// Check for explicit dev mode via env var or VITE dev server URL
const isDev = process.env.NODE_ENV === 'development' || !!process.env.VITE_DEV_SERVER_URL;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#1e1e2e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }


  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('app:maximized', { isMaximized: true });
  });

  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('app:maximized', { isMaximized: false });
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Register F12 and Ctrl+Shift+I to toggle DevTools
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' || (input.control && input.shift && input.key === 'I')) {
      mainWindow?.webContents.toggleDevTools();
      event.preventDefault();
    }
  });
}

async function initialize(): Promise<void> {
  configStore = new ConfigStore();
  terminalManager = new TerminalManager();

  registerIpcHandlers(ipcMain, terminalManager, configStore, () => mainWindow);
  registerGitIpcHandlers();
}

app.whenReady().then(async () => {
  await initialize();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  terminalManager?.killAll();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  terminalManager?.killAll();
});

export { mainWindow, terminalManager, configStore };

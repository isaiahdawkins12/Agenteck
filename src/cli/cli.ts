#!/usr/bin/env node

import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import type { StartupConfig, StartupTerminalConfig } from '../shared/types/startup';

interface StartupArgs {
  agent: string;
  directories: string[];
  terminalCount: number;
  detached: boolean;
}

function parseStartArgs(args: string[]): StartupArgs {
  const result: StartupArgs = {
    agent: 'claude',
    directories: [],
    terminalCount: 1,
    detached: false,
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg === '-a' || arg === '--agent') {
      result.agent = args[++i] || 'claude';
    } else if (arg === '-d' || arg === '--dir') {
      // Collect all following non-flag arguments as directories
      i++;
      while (i < args.length && !args[i].startsWith('-')) {
        result.directories.push(args[i]);
        i++;
      }
      continue; // Don't increment i again
    } else if (arg === '-t' || arg === '--terminals') {
      result.terminalCount = parseInt(args[++i], 10) || 1;
    } else if (arg === '--detached') {
      result.detached = true;
    }

    i++;
  }

  return result;
}

function buildStartupConfig(args: StartupArgs): StartupConfig | null {
  const terminals: StartupTerminalConfig[] = [];

  if (args.directories.length === 0) {
    return null; // No startup config needed
  }

  if (args.directories.length === 1) {
    // Single directory with terminal count
    for (let i = 0; i < args.terminalCount; i++) {
      terminals.push({
        agentId: args.agent,
        cwd: args.directories[0],
      });
    }
  } else {
    // Multiple directories, one terminal each
    for (const dir of args.directories) {
      terminals.push({
        agentId: args.agent,
        cwd: dir,
      });
    }
  }

  return { terminals };
}

const APP_NAME = 'agenteck';
const PID_FILE = path.join(os.tmpdir(), `${APP_NAME}.pid`);

function getElectronPath(): string {
  // Try to find electron in node_modules
  const localElectron = path.join(__dirname, '..', '..', 'node_modules', '.bin', 'electron');
  const localElectronCmd = localElectron + (process.platform === 'win32' ? '.cmd' : '');

  if (fs.existsSync(localElectronCmd)) {
    return localElectronCmd;
  }

  // Fall back to global electron
  return process.platform === 'win32' ? 'electron.cmd' : 'electron';
}

function getAppPath(): string {
  return path.join(__dirname, '..', '..');
}

function isRunning(): { running: boolean; pid?: number } {
  if (!fs.existsSync(PID_FILE)) {
    return { running: false };
  }

  try {
    const pid = parseInt(fs.readFileSync(PID_FILE, 'utf8').trim(), 10);

    // Check if process is still running
    try {
      process.kill(pid, 0); // Signal 0 just checks if process exists
      return { running: true, pid };
    } catch {
      // Process not running, clean up stale PID file
      fs.unlinkSync(PID_FILE);
      return { running: false };
    }
  } catch {
    return { running: false };
  }
}

function writePid(pid: number): void {
  fs.writeFileSync(PID_FILE, pid.toString(), 'utf8');
}

function removePid(): void {
  try {
    if (fs.existsSync(PID_FILE)) {
      fs.unlinkSync(PID_FILE);
    }
  } catch {
    // Ignore errors when removing PID file
  }
}

function start(detached: boolean = false, startupConfig: StartupConfig | null = null): void {
  const status = isRunning();

  if (status.running) {
    console.log(`Agenteck is already running (PID: ${status.pid})`);
    return;
  }

  const electronPath = getElectronPath();
  const appPath = getAppPath();

  console.log('Starting Agenteck...');

  const spawnOptions: Parameters<typeof spawn>[2] = {
    cwd: appPath,
    stdio: detached ? 'ignore' : 'inherit',
    detached: detached,
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      ...(startupConfig ? { AGENTECK_STARTUP_CONFIG: JSON.stringify(startupConfig) } : {}),
    },
  };

  let child: ChildProcess;

  if (process.platform === 'win32') {
    // On Windows, use cmd.exe to properly handle .cmd files
    child = spawn('cmd.exe', ['/c', electronPath, '.'], spawnOptions);
  } else {
    child = spawn(electronPath, ['.'], spawnOptions);
  }

  if (child.pid) {
    writePid(child.pid);
    console.log(`Agenteck started (PID: ${child.pid})`);

    if (detached) {
      child.unref();
      console.log('Running in background. Use "agenteck stop" to stop.');
    } else {
      // Wait for process to exit
      child.on('exit', (code) => {
        removePid();
        console.log(`Agenteck exited with code ${code}`);
      });

      child.on('error', (err) => {
        removePid();
        console.error('Failed to start Agenteck:', err.message);
      });
    }
  } else {
    console.error('Failed to start Agenteck: No process ID returned');
  }
}

function stop(): void {
  const status = isRunning();

  if (!status.running || !status.pid) {
    console.log('Agenteck is not running');
    removePid();
    return;
  }

  console.log(`Stopping Agenteck (PID: ${status.pid})...`);

  try {
    if (process.platform === 'win32') {
      // On Windows, use taskkill for cleaner termination
      spawn('taskkill', ['/PID', status.pid.toString(), '/T', '/F'], { stdio: 'inherit' });
    } else {
      process.kill(status.pid, 'SIGTERM');

      // Give it time to gracefully shutdown, then force kill if needed
      setTimeout(() => {
        try {
          process.kill(status.pid!, 0);
          // Still running, force kill
          process.kill(status.pid!, 'SIGKILL');
        } catch {
          // Process already exited
        }
      }, 3000);
    }

    removePid();
    console.log('Agenteck stopped');
  } catch (err) {
    if (err instanceof Error) {
      console.error('Failed to stop Agenteck:', err.message);
    }
    removePid();
  }
}

function showStatus(): void {
  const status = isRunning();

  if (status.running) {
    console.log(`Agenteck is running (PID: ${status.pid})`);
  } else {
    console.log('Agenteck is not running');
  }
}

function restart(): void {
  const status = isRunning();

  if (status.running) {
    stop();
    // Wait a moment for the process to fully stop
    setTimeout(() => start(true), 1000);
  } else {
    start(true);
  }
}

function showHelp(): void {
  console.log(`
Agenteck - Multi-agent terminal orchestrator

Usage: agenteck <command> [options]

Commands:
  start [options]     Start Agenteck
  stop                Stop Agenteck
  restart             Restart Agenteck
  status              Show Agenteck status
  help                Show this help message

Start Options:
  -a, --agent <id>    Agent to use (claude, gemini, codex, qwen, opencode)
                      Default: claude
  -d, --dir <paths>   Working directory/directories for terminals
  -t, --terminals <n> Number of terminals (when single directory)
                      Default: 1
  --detached          Run in background

Examples:
  agenteck start                          Start with no pre-configured terminals
  agenteck start -a claude -d C:\\source   Start with 1 claude terminal
  agenteck start -a claude -d . -t 2      Start with 2 claude terminals in cwd
  agenteck start -d /proj1 /proj2         Start with terminals in each directory
  agenteck start -a gemini -d . --detached  Start in background
`);
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0]?.toLowerCase() || 'help';

switch (command) {
  case 'start': {
    const startArgs = parseStartArgs(args.slice(1));
    const startupConfig = buildStartupConfig(startArgs);
    start(startArgs.detached, startupConfig);
    break;
  }
  case 'stop':
    stop();
    break;
  case 'restart':
    restart();
    break;
  case 'status':
    showStatus();
    break;
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  default:
    console.error(`Unknown command: ${command}`);
    showHelp();
    process.exit(1);
}

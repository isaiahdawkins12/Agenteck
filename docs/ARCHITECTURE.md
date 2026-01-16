# Agenteck Architecture

This document describes the technical architecture of Agenteck.

## Overview

Agenteck is built on Electron, which means it has two main processes:

1. **Main Process** (`src/main/`) - Node.js process that manages windows, system integration, and terminal processes
2. **Renderer Process** (`src/renderer/`) - Chromium-based web page running the React UI

Communication between processes happens via IPC (Inter-Process Communication).

## Main Process Architecture

### Entry Point (`main.ts`)

The main entry point handles:
- Application lifecycle events
- Window creation and management
- Initialization of services

### Terminal Management (`terminal/`)

#### TerminalManager

Manages the lifecycle of all terminal instances:
- Creates new terminals
- Routes data between renderer and terminal processes
- Handles cleanup on window close

#### TerminalProcess

Wraps `node-pty` to spawn and manage individual shell processes:
- Spawns shell processes with appropriate environment
- Handles data streaming via callbacks
- Manages resize events
- Graceful termination

### Configuration (`config/`)

#### ConfigStore

Uses `electron-store` for persistent JSON storage:
- Workspace state (layout, terminals)
- User preferences (themes, settings)
- Agent presets

### IPC Handlers (`ipc/`)

Registers all IPC handlers for communication with the renderer:
- Terminal operations (create, write, resize, kill)
- Configuration (get, set, workspace)
- App operations (minimize, maximize, close)

## Renderer Process Architecture

### React Application

Built with React 18 and TypeScript, using Vite for development and building.

### State Management (Zustand)

Four main stores manage application state:

#### terminalStore
- Active terminals and their sessions
- Output buffers for each terminal
- IPC event listeners

#### layoutStore
- Current mosaic layout tree
- Workspace metadata
- Layout operations (add/remove tiles)

#### themeStore
- Terminal themes (built-in and custom)
- UI theme configuration
- Per-terminal theme overrides

#### settingsStore
- User preferences
- Available shells
- Agent presets

### Component Structure

```
components/
├── titlebar/       # Custom frameless window titlebar
├── layout/         # Tiling layout components
│   ├── TileContainer   # Mosaic wrapper
│   └── Toolbar         # Top action bar
├── terminal/       # Terminal display components
│   ├── TerminalPanel   # Terminal container
│   ├── TerminalView    # xterm.js integration
│   └── TerminalHeader  # Terminal tab header
├── sidebar/        # Side panel components
│   ├── Sidebar         # Main sidebar container
│   ├── AgentList       # Available agents
│   ├── TerminalList    # Open terminals
│   └── LayoutPresets   # Layout shortcuts
└── settings/       # Settings dialog
    ├── SettingsDialog  # Main settings modal
    └── ThemeEditor     # Theme customization
```

### Hooks

Custom hooks abstract common functionality:

- `useTerminal` - Terminal lifecycle operations
- `useTheme` - Theme application and access
- `useIpc` - IPC communication utilities

## Data Flow

### Creating a Terminal

```
User clicks "New Terminal"
    ↓
useTerminal.createNewTerminal()
    ↓
terminalStore.createTerminal()
    ↓
IPC: terminal:create
    ↓
TerminalManager.create()
    ↓
new TerminalProcess()
    ↓
node-pty spawns shell
    ↓
Session returned to renderer
    ↓
layoutStore.addTile()
```

### Terminal Output

```
Shell produces output
    ↓
TerminalProcess.onData callback
    ↓
TerminalManager sends IPC: terminal:output
    ↓
terminalStore listener receives data
    ↓
terminalStore.appendOutput()
    ↓
TerminalView receives buffer update
    ↓
xterm.write(data)
```

### User Input

```
User types in terminal
    ↓
xterm.onData callback
    ↓
terminalStore.writeToTerminal()
    ↓
IPC: terminal:write
    ↓
TerminalManager.write()
    ↓
TerminalProcess.write()
    ↓
node-pty writes to shell
```

## IPC Protocol

### Channels

| Channel | Direction | Description |
|---------|-----------|-------------|
| `terminal:create` | Renderer → Main | Create new terminal |
| `terminal:write` | Renderer → Main | Send input to terminal |
| `terminal:resize` | Renderer → Main | Resize terminal |
| `terminal:kill` | Renderer → Main | Kill terminal process |
| `terminal:output` | Main → Renderer | Terminal output data |
| `terminal:exit` | Main → Renderer | Terminal process exited |
| `terminal:title` | Main → Renderer | Terminal title changed |
| `config:*` | Renderer → Main | Configuration operations |
| `app:*` | Renderer → Main | Window operations |

### Security

The preload script (`preload.ts`) acts as a secure bridge:
- Validates channel names against whitelist
- Uses `contextBridge` to expose limited API
- Prevents arbitrary code execution from renderer

## Layout System

Uses `react-mosaic-component` for the tiling window manager:

### Layout Tree Structure

```typescript
type MosaicNode<T> = T | {
  direction: 'row' | 'column';
  first: MosaicNode<T>;
  second: MosaicNode<T>;
  splitPercentage?: number;
}
```

Example layout with 3 terminals:
```javascript
{
  direction: 'row',
  first: 'terminal-1',
  second: {
    direction: 'column',
    first: 'terminal-2',
    second: 'terminal-3',
    splitPercentage: 50
  },
  splitPercentage: 60
}
```

## Theming System

### Terminal Themes

Each theme defines colors for:
- Background/foreground
- Cursor
- Selection
- 16 ANSI colors (8 normal + 8 bright)
- Font configuration

### UI Theme

CSS variables control the application UI:
```css
--color-primary
--color-background
--color-surface
--color-text
/* etc. */
```

## Persistence

### Workspace State

Saved on change and restored on startup:
```typescript
interface Workspace {
  id: string;
  name: string;
  layout: LayoutNode;
  terminals: Record<string, TerminalSession>;
  activeTerminalId?: string;
  createdAt: number;
  updatedAt: number;
}
```

Note: Terminal sessions are saved but shell state is not preserved across restarts.

## Future Considerations

- **Session persistence**: Save and restore terminal scrollback
- **Remote terminals**: SSH connections
- **Plugin system**: Custom agents and themes
- **Multi-window**: Support for multiple windows
- **Tabs**: Tab-based terminal organization within tiles

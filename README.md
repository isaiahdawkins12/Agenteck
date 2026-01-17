# Agenteck

A highly customizable desktop application for managing multiple CLI agents (Claude Code, GitHub Copilot CLI, Aider, Cline, etc.) in a unified interface with drag-and-drop tiling, theming, and full persistence.

## Features

- **Multi-Agent Support**: Launch and manage multiple AI CLI agents simultaneously
  - Claude Code
  - GitHub Copilot CLI
  - Aider
  - Cline
  - Continue
  - Custom agent presets

- **Flexible Tiling Layout**: Organize your terminals with drag-and-drop tiling
  - Split horizontally or vertically
  - Resize tiles by dragging borders
  - Layout presets (single, split, quad)
  - Save and restore layouts

- **Beautiful Theming**: Customize the look and feel
  - Multiple built-in themes (Dracula, Nord, Monokai, Tokyo Night)
  - Per-terminal theme overrides
  - Custom theme editor with live preview
  - Dark mode by default

- **Modern Terminal Emulation**: Powered by xterm.js
  - Full ANSI color support
  - Clickable URLs
  - Unicode support
  - Scrollback buffer

- **Workspace Persistence**: Never lose your setup
  - Auto-save workspace layout
  - Restore terminals on startup
  - Export/import workspaces

## Installation

### Prerequisites

- Node.js 18 or higher
- npm

### Quick Start

```bash
# Clone the repository
git clone https://github.com/isaiahdawkins12/Agenteck.git
cd Agenteck

# Install, build, and register the global command
npm run setup

# Now run from anywhere!
agenteck start
```

That's it! The `agenteck` command is now available system-wide.

### From Source (Development)

```bash
# Clone the repository
git clone https://github.com/isaiahdawkins12/Agenteck.git
cd Agenteck

# Install dependencies (auto-builds)
npm install

# Run in development mode
npm run dev

# In another terminal, start Electron
npm start
```

### Building

```bash
# Build for production
npm run build

# Package for your platform
npm run package

# Platform-specific packaging
npm run package:win    # Windows
npm run package:mac    # macOS
npm run package:linux  # Linux
```

## Usage

### Command Line Interface

After running `npm run setup`, the `agenteck` command is available globally:

```bash
agenteck start       # Start Agenteck (foreground)
agenteck start -d    # Start in background (detached)
agenteck stop        # Stop running instance
agenteck status      # Check if running
agenteck restart     # Restart Agenteck
agenteck help        # Show all commands
```

#### Alternative: npm scripts

If you prefer not to install globally, use npm scripts from the project directory:

```bash
npm run cli:start    # Start Agenteck
npm run cli:stop     # Stop Agenteck
npm run cli:status   # Check status
npm run cli -- help  # Show help
```

### Standalone Executable

Create a portable executable that doesn't require Node.js:

```bash
# Windows portable .exe
npm run package:portable

# Full installer (NSIS for Windows)
npm run package:win

# macOS .dmg
npm run package:mac

# Linux AppImage
npm run package:linux
```

Packaged files are output to the `release/` directory.

### GUI Usage

#### Creating Terminals

1. Click the **New** button in the toolbar to create a new terminal
2. Or click **New Terminal** at the bottom of the sidebar
3. Or use the keyboard shortcut (to be implemented)

#### Launching Agents

1. Open the **Agents** tab in the sidebar
2. Click on any agent to launch it in a new terminal
3. The agent will start with its default configuration

#### Managing Layout

- **Split horizontally**: Click "Split H" or drag a terminal to the side
- **Split vertically**: Click "Split V" or drag a terminal to the top/bottom
- **Resize**: Drag the borders between terminals
- **Presets**: Use the Layouts tab in the sidebar for quick layouts

#### Customizing Themes

1. Open Settings (gear icon)
2. Navigate to the Themes tab
3. Select a built-in theme or create a custom one
4. Use the theme editor to customize colors

## Architecture

```
agenteck/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── main.ts              # Entry point, window management
│   │   ├── preload.ts           # Context bridge for IPC
│   │   ├── terminal/            # Terminal process management
│   │   ├── config/              # Persistence layer
│   │   └── ipc/                 # IPC handlers
│   │
│   ├── renderer/                # React frontend
│   │   ├── components/          # React components
│   │   ├── store/               # Zustand state stores
│   │   ├── hooks/               # Custom React hooks
│   │   └── styles/              # CSS styles
│   │
│   └── shared/                  # Shared types & utilities
│       ├── types/               # TypeScript interfaces
│       └── constants.ts         # App constants
```

## Tech Stack

- **Electron**: Cross-platform desktop framework
- **React 18**: UI library
- **TypeScript**: Type-safe JavaScript
- **Zustand**: Lightweight state management
- **xterm.js**: Terminal emulation
- **node-pty**: Pseudo-terminal spawning
- **react-mosaic-component**: Tiling window manager
- **electron-store**: Persistent storage
- **Vite**: Fast build tooling

## Configuration

Configuration is stored in:
- Windows: `%APPDATA%/agenteck-config/config.json`
- macOS: `~/Library/Application Support/agenteck-config/config.json`
- Linux: `~/.config/agenteck-config/config.json`

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [xterm.js](https://xtermjs.org/) for terminal emulation
- [react-mosaic](https://github.com/nomcopter/react-mosaic) for the tiling layout
- [Catppuccin](https://github.com/catppuccin/catppuccin) for color inspiration

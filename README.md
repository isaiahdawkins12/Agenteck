# Agenteck

A desktop application for managing multiple CLI AI agents in a unified tiling interface.

<!-- TODO: Screenshot - Main application window showing multiple terminals with different agents -->
![Agenteck Main Interface](docs/screenshots/main-interface.png)

## Features

**Multi-Agent Support** — Launch Claude Code, GitHub Copilot CLI, Aider, Cline, Continue, or custom agents from a unified sidebar.

**Tiling Layout** — Drag-and-drop terminals into split views. Resize by dragging borders. Use layout presets for quick arrangements.

<!-- TODO: Screenshot - Tiling layout with 3-4 terminals arranged -->
![Tiling Layout](docs/screenshots/tiling-layout.png)
<!-- 
**Theming** — Built-in themes (Dracula, Nord, Monokai, Tokyo Night) with per-terminal overrides and a custom theme editor.

<!-- TODO: Screenshot - Theme selector or theme editor panel -->
![Theme Selection](docs/screenshots/themes.png) -->

**Terminal Emulation** — Powered by xterm.js with full ANSI colors, clickable URLs, Unicode, and scrollback.

**Workspace Persistence** — Layouts auto-save and restore on startup.

## Installation

### Prerequisites

- Node.js 18+
- npm

### Quick Start

```bash
git clone https://github.com/isaiahdawkins12/Agenteck.git
cd Agenteck
npm run setup
agenteck start
```

The `agenteck` command is now available globally.

### Development

```bash
git clone https://github.com/isaiahdawkins12/Agenteck.git
cd Agenteck
npm install
npm run dev      # Starts Vite dev server + TypeScript watch
npm start        # In another terminal, starts Electron
```

### Building & Packaging

```bash
npm run build              # Build for production
npm run package            # Package for current platform
npm run package:win        # Windows (NSIS + portable)
npm run package:mac        # macOS (DMG + ZIP)
npm run package:linux      # Linux (AppImage + DEB)
```

Packaged files output to `release/`.

## Usage

### CLI Commands

```bash
agenteck start       # Start Agenteck (foreground)
agenteck start -d    # Start in background (detached)
agenteck stop        # Stop running instance
agenteck status      # Check if running
agenteck restart     # Restart Agenteck
agenteck help        # Show all commands
```

Without global install, use `npm run cli:start`, `npm run cli:stop`, etc.

### GUI

<!-- TODO: Screenshot - Sidebar showing Agents tab with agent list -->
![Agent Sidebar](docs/screenshots/sidebar-agents.png)

**Creating Terminals** — Click **+** in the header or use the sidebar.

**Launching Agents** — Open the Agents tab in the sidebar and click any agent to launch it in a new terminal.

**Managing Layout** — Drag terminals to split horizontally/vertically. Drag borders to resize. Use the Layouts tab for presets.

<!-- TODO: Screenshot - Settings panel showing theme options -->
<!-- ![Settings Panel](docs/screenshots/settings.png) -->

<!-- **Customizing Themes** — Open Settings (gear icon), select a theme, or create a custom one with the theme editor. -->

## Architecture

```
src/
├── main/           # Electron main process
│   ├── main.ts     # Entry point, window management
│   ├── preload.ts  # Context bridge for IPC
│   ├── terminal/   # PTY process management
│   ├── config/     # Persistence (electron-store)
│   └── ipc/        # IPC handlers
├── renderer/       # React frontend
│   ├── components/ # UI components
│   ├── store/      # Zustand stores
│   ├── hooks/      # Custom hooks
│   └── styles/     # CSS
└── shared/         # Shared types & constants
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop | Electron 34 |
| UI | React 18 + TypeScript |
| State | Zustand |
| Terminal | xterm.js + node-pty |
| Layout | react-mosaic-component |
| Build | Vite |

## Configuration

Config location:
- **Windows**: `%APPDATA%/agenteck-config/config.json`
- **macOS**: `~/Library/Application Support/agenteck-config/config.json`
- **Linux**: `~/.config/agenteck-config/config.json`

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)

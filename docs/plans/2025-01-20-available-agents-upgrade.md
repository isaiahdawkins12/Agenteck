# Available Agents Tab Upgrade

**Date:** 2025-01-20
**Status:** Complete
**Branch:** master

## Overview

Upgrade the Available Agents tab in the sidebar with new agents, official brand icons, and proper persistence.

## Requirements

1. **Empty initial state** - Agents list starts blank with a prompt to add agents
2. **New agent lineup** - Support only: Claude, Gemini, Codex, Qwen, OpenCode
3. **Official SVG icons** - Bundle official brand logos for each agent
4. **Persistence** - Added agents persist across application restarts
5. **CLI commands** - Use simple defaults: `claude`, `gemini`, `codex`, `qwen`, `opencode`

## Current State Analysis

### Files Involved

| File | Purpose |
|------|---------|
| `src/shared/constants.ts` | Contains `AVAILABLE_AGENTS` array (lines 49-95) |
| `src/renderer/components/sidebar/AgentList.tsx` | Main agent list component |
| `src/renderer/components/sidebar/AgentSelector.tsx` | Agent picker dropdown |
| `src/renderer/components/sidebar/AgentLaunchButton.tsx` | Individual agent button with dropdown |
| `src/renderer/store/settingsStore.ts` | Zustand store (agents in memory, not persisted) |
| `src/main/config/ConfigStore.ts` | electron-store persistence (has agents schema but not wired up) |
| `src/main/ipc/handlers.ts` | IPC handlers (missing agent save/load handlers) |

### Current Agents (to be replaced)

1. Claude Code (`claude`)
2. GitHub Copilot CLI (`gh copilot`)
3. Aider (`aider`)
4. Cline (`cline`)
5. Continue (`continue`)

### Persistence Gap

- `ConfigStore` has `agents` in schema and `getAllAgents()` method
- `settingsStore` initializes `agents: []` but never loads from main process
- No IPC handlers exist for loading/saving agents

## New Agent Definitions

```typescript
export const AVAILABLE_AGENTS: AgentPreset[] = [
  {
    id: 'claude',
    name: 'Claude',
    command: 'claude',
    args: [],
    description: "Anthropic's AI coding assistant",
    website: 'https://claude.ai',
    isBuiltIn: true,
  },
  {
    id: 'gemini',
    name: 'Gemini',
    command: 'gemini',
    args: [],
    description: "Google's AI assistant CLI",
    website: 'https://gemini.google.com',
    isBuiltIn: true,
  },
  {
    id: 'codex',
    name: 'Codex',
    command: 'codex',
    args: [],
    description: "OpenAI's coding assistant",
    website: 'https://openai.com',
    isBuiltIn: true,
  },
  {
    id: 'qwen',
    name: 'Qwen',
    command: 'qwen',
    args: [],
    description: "Alibaba's AI coding assistant",
    website: 'https://qwen.ai',
    isBuiltIn: true,
  },
  {
    id: 'opencode',
    name: 'OpenCode',
    command: 'opencode',
    args: [],
    description: 'Open-source AI code assistant',
    website: 'https://github.com/opencode-ai/opencode',
    isBuiltIn: true,
  },
];
```

## Icon Strategy

- **Location:** `src/renderer/assets/agent-icons/`
- **Format:** SVG files
- **Files needed:**
  - `claude.svg` - Anthropic Claude logo
  - `gemini.svg` - Google Gemini sparkle symbol
  - `codex.svg` - OpenAI logo
  - `qwen.svg` - Alibaba Qwen logo
  - `opencode.svg` - OpenCode logo

Icons will be imported as React components or image sources.

## Implementation Plan

### Phase 1: Persistence Infrastructure

1. Add IPC channels for agent operations in `src/shared/constants.ts`
2. Add IPC handlers in `src/main/ipc/handlers.ts`:
   - `agent:get-all` - Load all saved agents
   - `agent:add` - Add agent to persistent storage
   - `agent:remove` - Remove agent from persistent storage
   - `agent:update` - Update agent in persistent storage
3. Add methods to `ConfigStore` for agent CRUD operations
4. Update `settingsStore` to load agents on init and sync changes to main process

### Phase 2: Update Agent Definitions

1. Replace `AVAILABLE_AGENTS` in `src/shared/constants.ts` with new 5 agents
2. Update `getAgentIcon()` functions in AgentList.tsx and AgentSelector.tsx

### Phase 3: Add SVG Icons

1. Create `src/renderer/assets/agent-icons/` directory
2. Add 5 SVG icon files
3. Create icon component or update AgentLaunchButton to use SVG icons
4. Update AgentSelector to show SVG icons

### Phase 4: UI Updates

1. Verify empty state works correctly (already exists)
2. Test add/remove agent flow
3. Verify persistence across app restarts

## Task Checklist

- [x] Create planning documentation (this file)
- [x] Phase 1: Persistence Infrastructure
  - [x] Add IPC channels to constants.ts
  - [x] Add agent CRUD methods to ConfigStore
  - [x] Add IPC handlers for agents
  - [x] Update settingsStore to load/save via IPC
- [x] Phase 2: Update Agent Definitions
  - [x] Replace AVAILABLE_AGENTS with new agents
  - [x] Remove old agent icon mappings
- [x] Phase 3: Add SVG Icons
  - [x] Create agent-icons directory
  - [x] Add claude.svg
  - [x] Add gemini.svg
  - [x] Add codex.svg
  - [x] Add qwen.svg
  - [x] Add opencode.svg
  - [x] Update components to use SVG icons
- [ ] Phase 4: Testing
  - [ ] Test empty state
  - [ ] Test adding agents
  - [ ] Test removing agents
  - [ ] Test persistence across restarts
  - [ ] Test launching agents

## Design Decisions

1. **SVG icons bundled in app** - Most reliable, works offline
2. **Simple CLI commands** - Use `claude`, `gemini`, `codex`, `qwen`, `opencode`
3. **Electron-store for persistence** - Already set up, just needs wiring

## Notes

- The AgentList empty state UI already exists and works
- ConfigStore already has agent schema, just needs CRUD methods and IPC wiring
- Recent directories persistence already works (separate from agent persistence)

import { useCallback } from 'react';
import { useTerminalStore } from '../store/terminalStore';
import { useLayoutStore } from '../store/layoutStore';
import { useSettingsStore } from '../store/settingsStore';
import type { TerminalCreateOptions, AgentPreset } from '@shared/types';

export function useTerminal() {
  const { createTerminal, killTerminal, terminals, activeTerminalId, setActiveTerminal } =
    useTerminalStore();
  const { addTile, removeTile } = useLayoutStore();
  const { defaultShell, agents } = useSettingsStore();

  const createNewTerminal = useCallback(
    async (options?: TerminalCreateOptions) => {
      const session = await createTerminal({
        shellType: defaultShell,
        ...options,
      });
      addTile(session.id);
      return session;
    },
    [createTerminal, addTile, defaultShell]
  );

  const launchAgent = useCallback(
    async (agentOrId: AgentPreset | string, cwd?: string) => {
      const agent = typeof agentOrId === 'string'
        ? agents.find((a) => a.id === agentOrId)
        : agentOrId;

      if (!agent) {
        throw new Error(`Agent not found: ${agentOrId}`);
      }

      // Priority: explicit cwd > agent.defaultCwd > undefined (uses process.cwd())
      const workingDirectory = cwd ?? agent.defaultCwd;

      const session = await createTerminal({
        command: agent.command,
        args: agent.args,
        title: agent.name,
        themeId: agent.defaultThemeId,
        cwd: workingDirectory,
      });
      addTile(session.id);
      return session;
    },
    [createTerminal, addTile, agents]
  );

  const closeTerminal = useCallback(
    async (terminalId: string) => {
      await killTerminal(terminalId);
      removeTile(terminalId);
    },
    [killTerminal, removeTile]
  );

  const closeAllTerminals = useCallback(async () => {
    const terminalIds = Object.keys(terminals);
    for (const id of terminalIds) {
      await closeTerminal(id);
    }
  }, [terminals, closeTerminal]);

  const splitTerminal = useCallback(
    async (direction: 'row' | 'column' = 'row', options?: TerminalCreateOptions) => {
      const session = await createTerminal({
        shellType: defaultShell,
        ...options,
      });
      addTile(session.id, direction);
      return session;
    },
    [createTerminal, addTile, defaultShell]
  );

  return {
    terminals,
    activeTerminalId,
    setActiveTerminal,
    createNewTerminal,
    launchAgent,
    closeTerminal,
    closeAllTerminals,
    splitTerminal,
  };
}

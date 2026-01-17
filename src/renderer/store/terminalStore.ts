import { create } from 'zustand';
import type { TerminalSession, TerminalCreateOptions, TerminalSize } from '@shared/types';
import { IPC_CHANNELS } from '@shared/constants';

interface TerminalState {
  terminals: Record<string, TerminalSession>;
  activeTerminalId: string | null;
  outputBuffers: Record<string, string[]>;
}

interface TerminalActions {
  createTerminal: (options?: TerminalCreateOptions) => Promise<TerminalSession>;
  writeToTerminal: (id: string, data: string) => Promise<void>;
  resizeTerminal: (id: string, size: TerminalSize) => Promise<void>;
  killTerminal: (id: string) => Promise<void>;
  setActiveTerminal: (id: string | null) => void;
  updateTerminal: (id: string, updates: Partial<TerminalSession>) => void;
  appendOutput: (id: string, data: string) => void;
  clearOutput: (id: string) => void;
  initializeListeners: () => () => void;
}

type TerminalStore = TerminalState & TerminalActions;

export const useTerminalStore = create<TerminalStore>((set, get) => ({
  terminals: {},
  activeTerminalId: null,
  outputBuffers: {},

  createTerminal: async (options = {}) => {
    const session = await window.electronAPI.invoke(
      IPC_CHANNELS.TERMINAL.CREATE,
      options
    ) as TerminalSession;

    set((state) => ({
      terminals: { ...state.terminals, [session.id]: session },
      activeTerminalId: session.id,
      outputBuffers: { ...state.outputBuffers, [session.id]: [] },
    }));

    return session;
  },

  writeToTerminal: async (id, data) => {
    await window.electronAPI.invoke(IPC_CHANNELS.TERMINAL.WRITE, id, data);
  },

  resizeTerminal: async (id, size) => {
    await window.electronAPI.invoke(IPC_CHANNELS.TERMINAL.RESIZE, id, size);
  },

  killTerminal: async (id) => {
    await window.electronAPI.invoke(IPC_CHANNELS.TERMINAL.KILL, id);

    set((state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [id]: removed, ...remaining } = state.terminals;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [id]: removedBuffer, ...remainingBuffers } = state.outputBuffers;

      let newActiveId = state.activeTerminalId;
      if (state.activeTerminalId === id) {
        const terminalIds = Object.keys(remaining);
        newActiveId = terminalIds.length > 0 ? terminalIds[0] : null;
      }

      return {
        terminals: remaining,
        activeTerminalId: newActiveId,
        outputBuffers: remainingBuffers,
      };
    });
  },

  setActiveTerminal: (id) => {
    set({ activeTerminalId: id });
  },

  updateTerminal: (id, updates) => {
    set((state) => {
      const terminal = state.terminals[id];
      if (!terminal) return state;

      return {
        terminals: {
          ...state.terminals,
          [id]: { ...terminal, ...updates },
        },
      };
    });
  },

  appendOutput: (id, data) => {
    set((state) => {
      const buffer = state.outputBuffers[id] || [];
      const newBuffer = [...buffer, data];

      if (newBuffer.length > 10000) {
        newBuffer.splice(0, newBuffer.length - 10000);
      }

      return {
        outputBuffers: {
          ...state.outputBuffers,
          [id]: newBuffer,
        },
      };
    });
  },

  clearOutput: (id) => {
    set((state) => ({
      outputBuffers: {
        ...state.outputBuffers,
        [id]: [],
      },
    }));
  },

  initializeListeners: () => {
    console.log('Initializing terminal IPC listeners');
    const unsubOutput = window.electronAPI.on(
      IPC_CHANNELS.TERMINAL.OUTPUT,
      (data: { id: string; data: string }) => {
        console.log(`Received output for terminal ${data.id}: ${data.data.length} chars`);
        get().appendOutput(data.id, data.data);
      }
    );

    const unsubExit = window.electronAPI.on(
      IPC_CHANNELS.TERMINAL.EXIT,
      (data: { id: string; code: number }) => {
        get().updateTerminal(data.id, {
          status: 'exited',
          exitCode: data.code,
        });
      }
    );

    const unsubTitle = window.electronAPI.on(
      IPC_CHANNELS.TERMINAL.TITLE,
      (data: { id: string; title: string }) => {
        get().updateTerminal(data.id, { title: data.title });
      }
    );

    return () => {
      unsubOutput();
      unsubExit();
      unsubTitle();
    };
  },
}));

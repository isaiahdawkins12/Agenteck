import { create } from 'zustand';
import type { MosaicNode } from 'react-mosaic-component';
import type { Workspace } from '@shared/types';
import { IPC_CHANNELS } from '@shared/constants';
import { v4 as uuidv4 } from 'uuid';

interface LayoutState {
  layout: MosaicNode<string> | null;
  workspaceId: string;
  workspaceName: string;
}

interface LayoutActions {
  setLayout: (layout: MosaicNode<string> | null) => void;
  addTile: (terminalId: string, direction?: 'row' | 'column') => void;
  removeTile: (terminalId: string) => void;
  loadWorkspace: () => Promise<void>;
  saveWorkspace: (terminals: Record<string, unknown>) => Promise<void>;
  createNewWorkspace: (name?: string) => void;
}

type LayoutStore = LayoutState & LayoutActions;

export const useLayoutStore = create<LayoutStore>((set, get) => ({
  layout: null,
  workspaceId: uuidv4(),
  workspaceName: 'Default Workspace',

  setLayout: (layout) => {
    set({ layout });
  },

  addTile: (terminalId, direction = 'row') => {
    const { layout } = get();

    if (!layout) {
      set({ layout: terminalId });
      return;
    }

    const newLayout: MosaicNode<string> = {
      direction,
      first: layout,
      second: terminalId,
      splitPercentage: 50,
    };

    set({ layout: newLayout });
  },

  removeTile: (terminalId) => {
    const { layout } = get();

    if (!layout) return;

    if (typeof layout === 'string') {
      if (layout === terminalId) {
        set({ layout: null });
      }
      return;
    }

    const removeFromNode = (node: MosaicNode<string>): MosaicNode<string> | null => {
      if (typeof node === 'string') {
        return node === terminalId ? null : node;
      }

      const first = removeFromNode(node.first);
      const second = removeFromNode(node.second);

      if (first === null && second === null) return null;
      if (first === null) return second;
      if (second === null) return first;

      return { ...node, first, second };
    };

    const newLayout = removeFromNode(layout);
    set({ layout: newLayout });
  },

  loadWorkspace: async () => {
    try {
      const workspace = await window.electronAPI.invoke(
        IPC_CHANNELS.CONFIG.GET_WORKSPACE
      ) as Workspace | null;

      if (workspace) {
        set({
          layout: workspace.layout as MosaicNode<string> | null,
          workspaceId: workspace.id,
          workspaceName: workspace.name,
        });
      }
    } catch (error) {
      console.error('Failed to load workspace:', error);
    }
  },

  saveWorkspace: async (terminals) => {
    const { layout, workspaceId, workspaceName } = get();

    const workspace: Workspace = {
      id: workspaceId,
      name: workspaceName,
      layout: layout as Workspace['layout'],
      terminals: terminals as Record<string, never>,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      await window.electronAPI.invoke(
        IPC_CHANNELS.CONFIG.SAVE_WORKSPACE,
        workspace
      );
    } catch (error) {
      console.error('Failed to save workspace:', error);
    }
  },

  createNewWorkspace: (name = 'New Workspace') => {
    set({
      layout: null,
      workspaceId: uuidv4(),
      workspaceName: name,
    });
  },
}));

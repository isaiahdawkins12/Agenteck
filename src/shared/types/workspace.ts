import type { TerminalSession } from './terminal';
import type { LayoutNode } from './layout';

export interface Workspace {
  id: string;
  name: string;
  layout: LayoutNode;
  terminals: Record<string, TerminalSession>;
  activeTerminalId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface WorkspaceState {
  currentWorkspace: Workspace | null;
  recentWorkspaces: WorkspaceInfo[];
}

export interface WorkspaceInfo {
  id: string;
  name: string;
  path?: string;
  lastOpened: number;
}

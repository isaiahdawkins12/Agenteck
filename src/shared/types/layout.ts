import type { MosaicNode } from 'react-mosaic-component';

export type LayoutDirection = 'row' | 'column';

export interface LayoutNodeBranch {
  direction: LayoutDirection;
  first: string | LayoutNodeBranch;
  second: string | LayoutNodeBranch;
  splitPercentage?: number;
}

export type LayoutNode = string | LayoutNodeBranch | null;

export type MosaicLayoutNode = MosaicNode<string> | null;

export interface LayoutPreset {
  id: string;
  name: string;
  description?: string;
  layout: LayoutNode;
  icon?: string;
}

export interface TileState {
  terminalId: string;
  isActive: boolean;
  isMaximized: boolean;
}

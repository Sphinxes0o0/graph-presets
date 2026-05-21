import { WorkspaceLeaf } from "obsidian";

// ====== Graph State ======

export interface GraphOptions {
  search: string;
  "collapse-filter": boolean;
  "collapse-color-groups": boolean;
  colorGroups: ColorGroup[];
  showTags: boolean;
  showAttachments: boolean;
  hideUnresolved: boolean;
  showOrphans: boolean;
  "collapse-display": boolean;
  showArrow: boolean;
  "collapse-forces": boolean;
  centerStrength: number;
  repelStrength: number;
  linkStrength: number;
  linkDistance: number;
  scale: number;
  [key: string]: unknown;
}

export interface ColorGroup {
  query: string;
  color: { a: number; rgb: number };
}

export interface NodePosition {
  id: string;
  x: number;
  y: number;
}

// ====== Preset ======

export interface Preset {
  id: string;
  name: string;
  options: GraphOptions;
  nodePositions: NodePosition[];
  createdAt: string;
  updatedAt: string;
}

// ====== Plugin Settings ======

export interface GraphPresetsSettings {
  presets: Preset[];
  activePresetId: string | null;
  restoreOnStartup: boolean;
}

export const DEFAULT_SETTINGS: GraphPresetsSettings = {
  presets: [],
  activePresetId: null,
  restoreOnStartup: true,
};

// ====== Obsidian Graph Internals ======

export interface GraphRenderer {
  nodes: NodePosition[];
  worker: Worker;
  autoRestored?: boolean;
}

export interface GraphDataEngine {
  getOptions(): GraphOptions;
  setOptions(options: Partial<GraphOptions>): void;
}

export interface GraphView {
  renderer: GraphRenderer;
  dataEngine: GraphDataEngine;
}

export type GraphLeaf = WorkspaceLeaf & { view: GraphView };

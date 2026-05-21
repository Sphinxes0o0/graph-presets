import { App, Notice } from "obsidian";
import { GraphLeaf, GraphOptions, NodePosition } from "./types";

export class GraphInterface {
  static findLeaf(app: App): GraphLeaf | null {
    const leaves = app.workspace.getLeavesOfType("graph");
    if (leaves.length === 0) {
      new Notice("No Graph View open");
      return null;
    }
    // Prefer active leaf if it's a graph view
    const active = app.workspace.activeLeaf;
    if (active?.view.getViewType() === "graph") {
      return active as GraphLeaf;
    }
    return leaves[0] as GraphLeaf;
  }

  static captureOptions(leaf: GraphLeaf): GraphOptions {
    return leaf.view.dataEngine.getOptions();
  }

  static capturePositions(leaf: GraphLeaf): NodePosition[] {
    return leaf.view.renderer.nodes.map((n) => ({
      id: n.id,
      x: n.x,
      y: n.y,
    }));
  }

  static applyOptions(leaf: GraphLeaf, options: GraphOptions): void {
    leaf.view.dataEngine.setOptions(options);
  }

  static applyPositions(leaf: GraphLeaf, positions: NodePosition[]): void {
    const worker = leaf.view.renderer.worker;
    positions.forEach((node) => {
      worker.postMessage({ forceNode: node });
    });
    // Trigger a redraw
    worker.postMessage({ run: true, alpha: 0.1 });
    // Unlock nodes after render
    setTimeout(() => {
      positions.forEach((node) => {
        worker.postMessage({ forceNode: { id: node.id, x: null, y: null } });
      });
    }, 600);
  }

  static waitForStable(
    leaf: GraphLeaf,
    stableCount: number,
    iterations: number,
    maxIterations: number,
    onReady: () => void
  ): void {
    if (maxIterations > 20) return;
    const current = leaf.view.renderer.nodes.length;
    if (current === stableCount && iterations >= 3) {
      onReady();
    } else {
      const nextStable = current === stableCount ? stableCount : current;
      const nextIter = current === stableCount ? iterations + 1 : 0;
      setTimeout(() => {
        GraphInterface.waitForStable(
          leaf, nextStable, nextIter, maxIterations + 1, onReady
        );
      }, 200);
    }
  }
}

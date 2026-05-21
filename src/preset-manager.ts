import { App, Notice } from "obsidian";
import { GraphPresetsSettings, Preset } from "./types";
import { GraphInterface } from "./graph-interface";

export class PresetManager {
  constructor(
    private app: App,
    private getSettings: () => GraphPresetsSettings,
    private saveSettings: () => Promise<void>
  ) {}

  list(): Preset[] {
    return this.getSettings().presets;
  }

  get(id: string): Preset | undefined {
    return this.getSettings().presets.find((p) => p.id === id);
  }

  get activePresetId(): string | null {
    return this.getSettings().activePresetId;
  }

  async saveCurrent(name: string): Promise<Preset> {
    const leaf = GraphInterface.findLeaf(this.app);
    if (!leaf) throw new Error("No Graph View open");

    const preset: Preset = {
      id: crypto.randomUUID(),
      name,
      options: GraphInterface.captureOptions(leaf),
      nodePositions: GraphInterface.capturePositions(leaf),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const settings = this.getSettings();
    settings.presets.push(preset);
    await this.saveSettings();
    new Notice(`Preset "${name}" saved`);
    return preset;
  }

  async updateCurrent(id: string): Promise<void> {
    const leaf = GraphInterface.findLeaf(this.app);
    if (!leaf) throw new Error("No Graph View open");
    const preset = this.get(id);
    if (!preset) throw new Error("Preset not found");

    preset.options = GraphInterface.captureOptions(leaf);
    preset.nodePositions = GraphInterface.capturePositions(leaf);
    preset.updatedAt = new Date().toISOString();
    await this.saveSettings();
    new Notice(`Preset "${preset.name}" updated`);
  }

  async activate(id: string): Promise<void> {
    const preset = this.get(id);
    if (!preset) throw new Error("Preset not found");
    const leaf = GraphInterface.findLeaf(this.app);
    if (!leaf) throw new Error("No Graph View open");

    GraphInterface.applyOptions(leaf, preset.options);
    GraphInterface.applyPositions(leaf, preset.nodePositions);

    const settings = this.getSettings();
    settings.activePresetId = id;
    await this.saveSettings();
    new Notice(`Activated: ${preset.name}`);
  }

  async restoreLastActive(): Promise<void> {
    const settings = this.getSettings();
    if (!settings.restoreOnStartup || !settings.activePresetId) return;

    const leaf = GraphInterface.findLeaf(this.app);
    if (!leaf) return;

    const preset = this.get(settings.activePresetId);
    if (!preset) return;

    GraphInterface.waitForStable(leaf, leaf.view.renderer.nodes.length, 0, 0, () => {
      GraphInterface.applyOptions(leaf, preset.options);
      GraphInterface.applyPositions(leaf, preset.nodePositions);
    });
  }

  async delete(id: string): Promise<void> {
    const settings = this.getSettings();
    const idx = settings.presets.findIndex((p) => p.id === id);
    if (idx < 0) return;

    const name = settings.presets[idx].name;
    settings.presets.splice(idx, 1);
    if (settings.activePresetId === id) {
      settings.activePresetId = null;
    }
    await this.saveSettings();
    new Notice(`Preset "${name}" deleted`);
  }

  async rename(id: string, newName: string): Promise<void> {
    const preset = this.get(id);
    if (!preset) return;
    preset.name = newName;
    preset.updatedAt = new Date().toISOString();
    await this.saveSettings();
  }
}

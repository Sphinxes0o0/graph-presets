import { Plugin } from "obsidian";
import { GraphPresetsSettings, DEFAULT_SETTINGS } from "./types";
import { PresetManager } from "./preset-manager";
import { GraphPresetsSettingTab } from "./settings-tab";

export default class GraphPresetsPlugin extends Plugin {
  settings!: GraphPresetsSettings;
  presetManager!: PresetManager;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.presetManager = new PresetManager(
      this.app,
      () => this.settings,
      async () => this.saveData(this.settings)
    );

    // Commands
    this.addCommand({
      id: "save-preset",
      name: "Save current graph as preset",
      callback: async () => {
        const name = `Preset ${this.settings.presets.length + 1}`;
        try {
          await this.presetManager.saveCurrent(name);
        } catch (e: any) {
          console.error(e.message);
        }
      },
    });

    this.addCommand({
      id: "restore-last-preset",
      name: "Restore last active preset",
      callback: () => this.presetManager.restoreLastActive(),
    });

    // Settings tab
    this.addSettingTab(new GraphPresetsSettingTab(this.app, this.presetManager, this));

    // Auto-restore on Graph View open
    this.registerEvent(
      this.app.workspace.on("layout-change", () => {
        const leaves = this.app.workspace.getLeavesOfType("graph");
        if (leaves.length > 0 && this.settings.restoreOnStartup) {
          setTimeout(() => this.presetManager.restoreLastActive(), 500);
        }
      })
    );
  }

  onunload(): void {}

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}

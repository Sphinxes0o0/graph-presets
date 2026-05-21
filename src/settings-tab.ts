import { App, PluginSettingTab, Setting } from "obsidian";
import { PresetManager } from "./preset-manager";
import { Preset, GraphPresetsSettings } from "./types";

interface PluginLike {
  settings: GraphPresetsSettings;
  saveData(data: GraphPresetsSettings): Promise<void>;
}

export class GraphPresetsSettingTab extends PluginSettingTab {
  private mgr: PresetManager;
  private plugin: PluginLike;

  constructor(app: App, mgr: PresetManager, plugin: PluginLike) {
    super(app, plugin as any);
    this.mgr = mgr;
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Graph Presets" });

    const presets = this.mgr.list();

    // --- Preset List ---
    if (presets.length === 0) {
      containerEl.createEl("p", {
        text: "No presets yet. Open a Graph View, set up filters/colors, then save.",
        cls: "setting-item-description",
      });
    } else {
      containerEl.createEl("h3", { text: "Saved Presets" });
      presets.forEach((preset) => this.renderPresetRow(containerEl, preset));
    }

    // --- Actions ---
    containerEl.createEl("h3", { text: "Actions" });

    new Setting(containerEl)
      .setName("Save current Graph View")
      .setDesc("Capture the active Graph View's filter, color groups, and node positions")
      .addButton((btn) =>
        btn.setButtonText("Save as Preset").setClass("mod-cta").onClick(() => this.promptSave())
      );

    const activePreset = presets.find((p) => p.id === this.mgr.activePresetId);
    if (activePreset) {
      new Setting(containerEl)
        .setName(`Update "${activePreset.name}"`)
        .setDesc("Overwrite active preset with current Graph View state")
        .addButton((btn) =>
          btn.setButtonText("Update").onClick(async () => {
            await this.mgr.updateCurrent(activePreset.id);
            this.display();
          })
        );
    }

    // --- Settings ---
    containerEl.createEl("h3", { text: "Settings" });

    new Setting(containerEl)
      .setName("Restore on startup")
      .setDesc("Automatically restore last active preset when opening Obsidian")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.restoreOnStartup).onChange(async (value) => {
          this.plugin.settings.restoreOnStartup = value;
          await this.plugin.saveData(this.plugin.settings);
        })
      );
  }

  private renderPresetRow(containerEl: HTMLElement, preset: Preset): void {
    const isActive = this.mgr.activePresetId === preset.id;
    new Setting(containerEl)
      .setName(isActive ? `★ ${preset.name}` : preset.name)
      .setDesc(
        `Filter: ${preset.options.search || "(none)"} · ` +
        `${preset.options.colorGroups?.length ?? 0} color groups · ` +
        `${preset.updatedAt.slice(0, 10)}`
      )
      .addButton((btn) =>
        btn
          .setButtonText(isActive ? "Active" : "Activate")
          .setClass(isActive ? "mod-cta" : "")
          .onClick(async () => {
            await this.mgr.activate(preset.id);
            this.display();
          })
      )
      .addExtraButton((btn) =>
        btn.setIcon("pencil").setTooltip("Rename").onClick(() => this.promptRename(preset))
      )
      .addExtraButton((btn) =>
        btn
          .setIcon("trash")
          .setTooltip("Delete")
          .onClick(async () => {
            await this.mgr.delete(preset.id);
            this.display();
          })
      );
  }

  private promptSave(): void {
    const name = window.prompt("Preset name:");
    if (name) this.mgr.saveCurrent(name).then(() => this.display());
  }

  private promptRename(preset: Preset): void {
    const newName = window.prompt("New name:", preset.name);
    if (newName && newName !== preset.name) {
      this.mgr.rename(preset.id, newName).then(() => this.display());
    }
  }
}

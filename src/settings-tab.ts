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

    if (presets.length === 0) {
      containerEl.createEl("p", {
        text: "No presets yet. Open a Graph View, set up filters/colors, then click 📁 Presets → Save.",
        cls: "setting-item-description",
      });
    } else {
      containerEl.createEl("p", {
        text: `${presets.length} preset(s). Activate them from the Graph View panel.`,
        cls: "setting-item-description",
      });
      presets.forEach((preset) => this.renderRow(containerEl, preset));
    }
  }

  private renderRow(containerEl: HTMLElement, preset: Preset): void {
    const filter = preset.options.search || "(all)";
    const colors = preset.options.colorGroups?.length ?? 0;
    new Setting(containerEl)
      .setName(preset.name)
      .setDesc(`Filter: ${filter} · ${colors} color groups · ${preset.updatedAt.slice(0, 10)}`)
      .addExtraButton((btn) =>
        btn.setIcon("pencil").setTooltip("Rename").onClick(() => {
          const newName = window.prompt("New name:", preset.name);
          if (newName && newName !== preset.name) {
            this.mgr.rename(preset.id, newName).then(() => this.display());
          }
        })
      )
      .addExtraButton((btn) =>
        btn.setIcon("trash").setTooltip("Delete").onClick(async () => {
          await this.mgr.delete(preset.id);
          this.display();
        })
      );
  }
}

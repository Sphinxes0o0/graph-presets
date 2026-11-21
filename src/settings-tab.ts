import { App, ButtonComponent, Notice, PluginSettingTab, Setting } from "obsidian";
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
    const row = new Setting(containerEl)
      .setName(preset.name)
      .setDesc(`Filter: ${filter} · ${colors} color groups · ${preset.updatedAt.slice(0, 10)}`);

    row
      .addExtraButton((btn) =>
        btn.setIcon("pencil").setTooltip("Rename").onClick(() => this.editName(row, preset))
      )
      .addExtraButton((btn) =>
        btn.setIcon("trash").setTooltip("Delete").onClick(() => this.confirmDelete(row, preset))
      );
  }

  private editName(row: Setting, preset: Preset): void {
    const form = row.clear().controlEl.createEl("form", { cls: "setting-item-control" });
    const input = form.createEl("input", {
      type: "text",
      value: preset.name,
      attr: { "aria-label": "New name", required: true },
    });
    const cancel = new ButtonComponent(form).setButtonText("Cancel").onClick(() => this.display());
    cancel.buttonEl.type = "button";
    const submit = new ButtonComponent(form).setButtonText("Rename").setCta();
    submit.buttonEl.type = "submit";
    submit.setDisabled(!input.value.trim());

    input.addEventListener("input", () => submit.setDisabled(!input.value.trim()));
    input.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || event.isComposing) return;
      event.preventDefault();
      event.stopPropagation();
      this.display();
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = input.value.trim();
      if (!name) return;
      if (name === preset.name) {
        this.display();
        return;
      }
      input.disabled = true;
      cancel.setDisabled(true);
      submit.setDisabled(true);
      void this.changePreset(() => this.mgr.rename(preset.id, name));
    });
    input.focus();
    input.select();
  }

  private confirmDelete(row: Setting, preset: Preset): void {
    row.clear().setDesc(`Delete "${preset.name}"?`)
      .addButton((btn) => btn.setButtonText("Cancel").onClick(() => this.display()))
      .addButton((btn) => btn.setButtonText("Delete").setWarning().onClick(() => {
        row.setDisabled(true);
        return this.changePreset(() => this.mgr.delete(preset.id));
      }));
  }

  private async changePreset(change: () => Promise<void>): Promise<void> {
    try {
      await change();
    } catch (error) {
      new Notice(error instanceof Error ? error.message : String(error));
    }
    this.display();
  }
}

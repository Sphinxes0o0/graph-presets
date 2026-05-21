import { App, Notice } from "obsidian";
import { PresetManager } from "./preset-manager";

const INJECTED_ATTR = "data-graph-presets-injected";

export class HeaderUI {
  static inject(_app: App, presetManager: PresetManager): void {
    requestAnimationFrame(() => {
      // Find the graph controls bar (toolbar above the graph canvas)
      const controls = document.querySelector(".graph-controls");
      if (!controls) return;

      // Avoid double-injection
      if (controls.hasAttribute(INJECTED_ATTR)) return;
      controls.setAttribute(INJECTED_ATTR, "true");

      // Build the preset selector + save button row
      const row = controls.createEl("div", {
        cls: "graph-presets-header-row",
      });
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.gap = "6px";

      // Preset dropdown
      const select = row.createEl("select", {
        cls: "graph-presets-select dropdown",
      });
      select.style.maxWidth = "200px";

      // Save button
      const saveBtn = row.createEl("button", {
        text: "Save",
        cls: "graph-presets-save-btn",
      });
      saveBtn.style.fontSize = "12px";

      // Event: change preset
      select.addEventListener("change", async () => {
        const id = (select as HTMLSelectElement).value;
        if (!id) return;
        try {
          await presetManager.activate(id);
          HeaderUI.refreshDropdown(select, presetManager);
        } catch (e: any) {
          new Notice(e.message);
        }
      });

      // Event: save preset
      saveBtn.addEventListener("click", async () => {
        const name = window.prompt("Preset name:");
        if (!name) return;
        try {
          await presetManager.saveCurrent(name);
          HeaderUI.refreshDropdown(select, presetManager);
        } catch (e: any) {
          new Notice(e.message);
        }
      });

      // Initial population
      HeaderUI.refreshDropdown(select, presetManager);
    });
  }

  private static refreshDropdown(select: HTMLSelectElement, mgr: PresetManager): void {
    const presets = mgr.list();
    const activeId = mgr.activePresetId;

    select.innerHTML = "";

    if (presets.length === 0) {
      const opt = select.createEl("option", { value: "", text: "No presets" });
      opt.disabled = true;
      opt.selected = true;
      select.disabled = true;
      return;
    }

    select.disabled = false;
    presets.forEach((p) => {
      const filterPreview = p.options.search
        ? `"${p.options.search}"`
        : "(all)";
      const opt = select.createEl("option", {
        value: p.id,
        text: `${p.name} \u2014 ${filterPreview}`,
      });
      if (p.id === activeId) {
        opt.selected = true;
      }
    });
  }
}

import { App, Notice } from "obsidian";
import { PresetManager } from "./preset-manager";

const INJECTED_ATTR = "data-graph-presets-injected";

export class HeaderUI {
  static inject(_app: App, presetManager: PresetManager): void {
    requestAnimationFrame(() => {
      const controls = document.querySelector(".graph-controls");
      if (!controls) return;
      if (controls.hasAttribute(INJECTED_ATTR)) return;
      controls.setAttribute(INJECTED_ATTR, "true");

      const row = controls.createEl("div", { cls: "graph-presets-header-row" });
      row.style.cssText = "display:flex;align-items:center;gap:6px;margin-left:8px";

      // Preset dropdown
      const select = row.createEl("select", { cls: "graph-presets-select dropdown" });
      select.style.maxWidth = "180px";

      // Save button
      const saveBtn = row.createEl("button", { text: "Save", cls: "graph-presets-save-btn" });
      saveBtn.style.fontSize = "12px";

      // Delete button
      const delBtn = row.createEl("button", { text: "Del", cls: "graph-presets-del-btn" });
      delBtn.style.cssText = "font-size:12px;color:var(--text-error)";

      // --- Events ---

      select.addEventListener("change", async () => {
        const id = (select as HTMLSelectElement).value;
        if (!id) return;
        try {
          await presetManager.activate(id);
          HeaderUI.refreshDropdown(select, presetManager);
        } catch (e: any) { new Notice(e.message); }
      });

      saveBtn.addEventListener("click", () => {
        const input = row.createEl("input", {
          type: "text", placeholder: "Preset name...", cls: "graph-presets-name-input",
        });
        input.style.cssText = "font-size:12px;width:120px";
        saveBtn.style.display = "none";

        const doSave = async () => {
          const name = input.value.trim();
          input.remove();
          saveBtn.style.display = "";
          if (!name) return;
          try {
            await presetManager.saveCurrent(name);
            HeaderUI.refreshDropdown(select, presetManager);
          } catch (e: any) { new Notice(e.message); }
        };

        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") doSave();
          if (e.key === "Escape") { input.remove(); saveBtn.style.display = ""; }
        });
        input.addEventListener("blur", () => doSave());
        input.focus();
      });

      delBtn.addEventListener("click", async () => {
        const id = (select as HTMLSelectElement).value;
        if (!id) { new Notice("No preset selected"); return; }
        const preset = presetManager.list().find(p => p.id === id);
        if (!preset) return;
        if (confirm(`Delete "${preset.name}"?`)) {
          await presetManager.delete(id);
          HeaderUI.refreshDropdown(select, presetManager);
        }
      });

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
      const opt = select.createEl("option", { value: p.id, text: p.name });
      if (p.id === activeId) opt.selected = true;
    });
  }
}

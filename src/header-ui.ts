import { App, Notice } from "obsidian";
import { PresetManager } from "./preset-manager";

const PANEL_ID = "graph-presets-panel";

export class HeaderUI {
  static inject(app: App, presetManager: PresetManager): void {
    requestAnimationFrame(() => {
      const leaf = app.workspace.getLeavesOfType("graph")[0];
      if (!leaf) return;
      const graphContainer = leaf.view.containerEl as HTMLElement;
      if (!graphContainer || document.getElementById(PANEL_ID)) return;

      // Floating panel container (bottom-left)
      const panel = document.createElement("div");
      panel.id = PANEL_ID;
      panel.style.cssText = `
        position:absolute; bottom:12px; left:12px; z-index:10;
        background:var(--background-primary); border:1px solid var(--background-modifier-border);
        border-radius:8px; padding:6px 8px; font-size:12px;
        box-shadow:0 2px 8px rgba(0,0,0,0.15); min-width:180px;
      `;
      graphContainer.appendChild(panel);

      // Toggle button (collapsed state)
      const toggleBtn = panel.createEl("button", {
        text: "📁 Presets",
        cls: "graph-presets-toggle",
      });
      toggleBtn.style.cssText = "font-size:12px;width:100%;cursor:pointer;";

      // Body (shown when expanded)
      const body = panel.createEl("div", { cls: "graph-presets-body" });
      body.style.display = "none";

      // Dropdown
      const select = body.createEl("select", { cls: "dropdown" });
      select.style.cssText = "width:100%;margin-bottom:4px;";

      // Buttons row
      const btnRow = body.createEl("div");
      btnRow.style.cssText = "display:flex;gap:4px;";

      const saveBtn = btnRow.createEl("button", { text: "Save" });
      saveBtn.style.cssText = "font-size:11px;flex:1;";
      const delBtn = btnRow.createEl("button", { text: "Del" });
      delBtn.style.cssText = "font-size:11px;flex:1;color:var(--text-error);";

      let expanded = false;
      toggleBtn.addEventListener("click", () => {
        expanded = !expanded;
        body.style.display = expanded ? "block" : "none";
        toggleBtn.textContent = expanded ? "📁 Presets ▲" : "📁 Presets";
        if (expanded) HeaderUI.refreshDropdown(select, presetManager);
      });

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
        const input = body.createEl("input", {
          type: "text", placeholder: "name...",
        });
        input.style.cssText = "width:100%;margin-bottom:4px;font-size:12px;";
        saveBtn.style.display = "none"; delBtn.style.display = "none";

        const doSave = async () => {
          const name = input.value.trim();
          input.remove();
          saveBtn.style.display = ""; delBtn.style.display = "";
          if (!name) return;
          try {
            await presetManager.saveCurrent(name);
            HeaderUI.refreshDropdown(select, presetManager);
          } catch (e: any) { new Notice(e.message); }
        };
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") doSave();
          if (e.key === "Escape") { input.remove(); saveBtn.style.display = ""; delBtn.style.display = ""; }
        });
        input.focus();
      });

      delBtn.addEventListener("click", async () => {
        const id = (select as HTMLSelectElement).value;
        if (!id) { new Notice("No preset selected"); return; }
        const p = presetManager.list().find((p) => p.id === id);
        if (!p) return;
        if (confirm(`Delete "${p.name}"?`)) {
          await presetManager.delete(id);
          HeaderUI.refreshDropdown(select, presetManager);
        }
      });
    });
  }

  private static refreshDropdown(select: HTMLSelectElement, mgr: PresetManager): void {
    const presets = mgr.list();
    const activeId = mgr.activePresetId;
    select.innerHTML = "";
    if (presets.length === 0) {
      const opt = select.createEl("option", { value: "", text: "No presets" });
      opt.disabled = true; opt.selected = true;
      return;
    }
    presets.forEach((p) => {
      const opt = select.createEl("option", { value: p.id, text: p.name });
      if (p.id === activeId) opt.selected = true;
    });
  }
}

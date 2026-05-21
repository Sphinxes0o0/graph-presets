import { App, Notice } from "obsidian";
import { PresetManager } from "./preset-manager";

const PANEL_ID = "graph-presets-panel";

export class HeaderUI {
  private static app: App;

  static injectAll(app: App, presetManager: PresetManager): void {
    HeaderUI.app = app;
    (HeaderUI as any)._mgr = presetManager;
    requestAnimationFrame(() => {
      const leaves = app.workspace.getLeavesOfType("graph");
      leaves.forEach((leaf) => {
        const container = leaf.view.containerEl as HTMLElement;
        if (!container || container.querySelector(`#${PANEL_ID}`)) return;
        HeaderUI.injectOne(container, presetManager);
      });
    });
  }

  private static injectOne(graphContainer: HTMLElement, presetManager: PresetManager): void {

      const panel = document.createElement("div");
      panel.id = PANEL_ID;
      panel.style.cssText = `
        position:absolute; bottom:12px; left:12px; z-index:10;
        background:var(--background-primary); border:1px solid var(--background-modifier-border);
        border-radius:8px; padding:6px 8px; font-size:12px;
        box-shadow:0 2px 8px rgba(0,0,0,0.15); min-width:200px;
      `;
      graphContainer.appendChild(panel);

      const toggleBtn = panel.createEl("button", {
        text: "📁 Presets", cls: "graph-presets-toggle",
      });
      toggleBtn.style.cssText = "font-size:12px;width:100%;cursor:pointer;";

      const body = panel.createEl("div", { cls: "graph-presets-body" });
      body.style.display = "none";

      const select = body.createEl("select", { cls: "dropdown" });
      select.style.cssText = "width:100%;margin-bottom:4px;";

      const btnRow = body.createEl("div");
      btnRow.style.cssText = "display:flex;gap:3px;";

      const primaryBtn = btnRow.createEl("button");  // Save or Update
      primaryBtn.style.cssText = "font-size:11px;flex:1;";
      const newBtn = btnRow.createEl("button", { text: "+" });  // Save As New
      newBtn.style.cssText = "font-size:11px;flex:0 0 24px;";
      const delBtn = btnRow.createEl("button", { text: "🗑" });
      delBtn.style.cssText = "font-size:11px;flex:0 0 28px;color:var(--text-error);";

      let expanded = false;
      toggleBtn.addEventListener("click", () => {
        expanded = !expanded;
        body.style.display = expanded ? "block" : "none";
        toggleBtn.textContent = expanded ? "📁 Presets ▲" : "📁 Presets";
        if (expanded) HeaderUI.refresh(select, primaryBtn, newBtn, presetManager);
      });

      // --- Dropdown change ---
      select.addEventListener("change", async () => {
        const id = (select as HTMLSelectElement).value;
        if (!id) return;
        try {
          await presetManager.activate(id);
          HeaderUI.refresh(select, primaryBtn, newBtn, presetManager);
        } catch (e: any) { new Notice(e.message); }
      });

      // --- Primary: Save (new) or Update (overwrite) ---
      primaryBtn.addEventListener("click", () => {
        const activeId = presetManager.activePresetId;
        if (activeId) {
          // Overwrite active preset — no prompt
          presetManager.updateCurrent(activeId).then(() => {
            HeaderUI.refresh(select, primaryBtn, newBtn, presetManager);
          }).catch((e: any) => new Notice(e.message));
        } else {
          // No presets — prompt for name
          HeaderUI.promptSave(body, select, primaryBtn, newBtn, delBtn, presetManager);
        }
      });

      // --- "+": Save As New (always prompts) ---
      newBtn.addEventListener("click", () => {
        HeaderUI.promptSave(body, select, primaryBtn, newBtn, delBtn, presetManager);
      });

      // --- Delete ---
      delBtn.addEventListener("click", async () => {
        const id = (select as HTMLSelectElement).value;
        if (!id) { new Notice("No preset selected"); return; }
        const p = presetManager.list().find((p) => p.id === id);
        if (!p) return;
        if (confirm(`Delete "${p.name}"?`)) {
          await presetManager.delete(id);
          HeaderUI.refresh(select, primaryBtn, newBtn, presetManager);
        }
      });
  }

  /** Show inline name input, then save as new preset */
  private static promptSave(
    body: HTMLElement,
    select: HTMLSelectElement,
    primaryBtn: HTMLButtonElement,
    newBtn: HTMLButtonElement,
    delBtn: HTMLButtonElement,
    mgr: PresetManager
  ): void {
    const input = body.createEl("input", {
      type: "text", placeholder: "preset name...",
    });
    input.style.cssText = "width:100%;margin-bottom:4px;font-size:12px;";
    primaryBtn.style.display = "none";
    newBtn.style.display = "none";
    delBtn.style.display = "none";

    const doSave = async () => {
      const name = input.value.trim();
      input.remove();
      primaryBtn.style.display = "";
      newBtn.style.display = "";
      delBtn.style.display = "";
      if (!name) return;
      try {
        await mgr.saveCurrent(name);
        HeaderUI.refresh(select, primaryBtn, newBtn, mgr);
      } catch (e: any) { new Notice(e.message); }
    };

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") doSave();
      if (e.key === "Escape") {
        input.remove();
        primaryBtn.style.display = "";
        newBtn.style.display = "";
        delBtn.style.display = "";
      }
    });
    input.focus();
  }

  private static refresh(
    select: HTMLSelectElement,
    primaryBtn: HTMLButtonElement,
    newBtn: HTMLButtonElement,
    mgr: PresetManager
  ): void {
    const presets = mgr.list();
    const activeId = mgr.activePresetId;
    select.innerHTML = "";

    if (presets.length === 0) {
      const opt = select.createEl("option", { value: "", text: "No presets" });
      opt.disabled = true; opt.selected = true;
      primaryBtn.textContent = "Save";
      newBtn.style.display = "none";
      HeaderUI.updateTabTitle();
      return;
    }

    const hasActive = presets.some((p) => p.id === activeId);
    primaryBtn.textContent = hasActive ? "Update" : "Save";
    newBtn.style.display = "";

    presets.forEach((p) => {
      const opt = select.createEl("option", { value: p.id, text: p.name });
      if (p.id === activeId) opt.selected = true;
    });

    HeaderUI.updateTabTitle();
  }

  static updateTabTitle(): void {
    const leaves = HeaderUI.app.workspace.getLeavesOfType("graph");
    leaves.forEach((leaf) => {
      const tabHeader = (leaf as any).tabHeaderEl as HTMLElement | null;
      if (!tabHeader) return;
      const titleEl = tabHeader.querySelector(".workspace-tab-header-inner-title");
      if (!titleEl) return;

      // Find THIS leaf's panel and its selected preset
      const container = leaf.view.containerEl as HTMLElement;
      const select = container.querySelector(`#${PANEL_ID} select`) as HTMLSelectElement | null;
      const selectedId = select?.value;
      let title = "Graph view";
      if (selectedId) {
        // Need presetManager reference — use a stored static ref
        const preset = (HeaderUI as any)._mgr?.list().find((p: any) => p.id === selectedId);
        if (preset) title = `Graph: ${preset.name}`;
      }
      titleEl.textContent = title;
    });
  }
}
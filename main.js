"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => GraphPresetsPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian4 = require("obsidian");

// src/types.ts
var DEFAULT_SETTINGS = {
  presets: [],
  activePresetId: null,
  restoreOnStartup: true
};

// src/preset-manager.ts
var import_obsidian2 = require("obsidian");

// src/graph-interface.ts
var import_obsidian = require("obsidian");
var GraphInterface = class _GraphInterface {
  static findLeaf(app) {
    const leaves = app.workspace.getLeavesOfType("graph");
    if (leaves.length === 0) {
      new import_obsidian.Notice("No Graph View open");
      return null;
    }
    const active = app.workspace.activeLeaf;
    if (active?.view.getViewType() === "graph") {
      return active;
    }
    return leaves[0];
  }
  static captureOptions(leaf) {
    return leaf.view.dataEngine.getOptions();
  }
  static capturePositions(leaf) {
    return leaf.view.renderer.nodes.map((n) => ({
      id: n.id,
      x: n.x,
      y: n.y
    }));
  }
  static applyOptions(leaf, options) {
    leaf.view.dataEngine.setOptions(options);
  }
  static applyPositions(leaf, positions) {
    const worker = leaf.view.renderer.worker;
    positions.forEach((node) => {
      worker.postMessage({ forceNode: node });
    });
    worker.postMessage({ run: true, alpha: 0.1 });
    setTimeout(() => {
      positions.forEach((node) => {
        worker.postMessage({ forceNode: { id: node.id, x: null, y: null } });
      });
    }, 600);
  }
  static waitForStable(leaf, stableCount, iterations, maxIterations, onReady) {
    if (maxIterations > 20)
      return;
    const current = leaf.view.renderer.nodes.length;
    if (current === stableCount && iterations >= 3) {
      onReady();
    } else {
      const nextStable = current === stableCount ? stableCount : current;
      const nextIter = current === stableCount ? iterations + 1 : 0;
      setTimeout(() => {
        _GraphInterface.waitForStable(
          leaf,
          nextStable,
          nextIter,
          maxIterations + 1,
          onReady
        );
      }, 200);
    }
  }
};

// src/preset-manager.ts
var PresetManager = class {
  constructor(app, getSettings, saveSettings) {
    this.app = app;
    this.getSettings = getSettings;
    this.saveSettings = saveSettings;
  }
  list() {
    return this.getSettings().presets;
  }
  get(id) {
    return this.getSettings().presets.find((p) => p.id === id);
  }
  get activePresetId() {
    return this.getSettings().activePresetId;
  }
  async saveCurrent(name) {
    const leaf = GraphInterface.findLeaf(this.app);
    if (!leaf)
      throw new Error("No Graph View open");
    const preset = {
      id: crypto.randomUUID(),
      name,
      options: GraphInterface.captureOptions(leaf),
      nodePositions: GraphInterface.capturePositions(leaf),
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const settings = this.getSettings();
    settings.presets.push(preset);
    await this.saveSettings();
    new import_obsidian2.Notice(`Preset "${name}" saved`);
    return preset;
  }
  async updateCurrent(id) {
    const leaf = GraphInterface.findLeaf(this.app);
    if (!leaf)
      throw new Error("No Graph View open");
    const preset = this.get(id);
    if (!preset)
      throw new Error("Preset not found");
    preset.options = GraphInterface.captureOptions(leaf);
    preset.nodePositions = GraphInterface.capturePositions(leaf);
    preset.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    await this.saveSettings();
    new import_obsidian2.Notice(`Preset "${preset.name}" updated`);
  }
  async activate(id) {
    const preset = this.get(id);
    if (!preset)
      throw new Error("Preset not found");
    const leaf = GraphInterface.findLeaf(this.app);
    if (!leaf)
      throw new Error("No Graph View open");
    GraphInterface.applyOptions(leaf, preset.options);
    GraphInterface.applyPositions(leaf, preset.nodePositions);
    const settings = this.getSettings();
    settings.activePresetId = id;
    await this.saveSettings();
    new import_obsidian2.Notice(`Activated: ${preset.name}`);
  }
  async restoreLastActive() {
    const settings = this.getSettings();
    if (!settings.restoreOnStartup || !settings.activePresetId)
      return;
    const leaf = GraphInterface.findLeaf(this.app);
    if (!leaf)
      return;
    const preset = this.get(settings.activePresetId);
    if (!preset)
      return;
    GraphInterface.waitForStable(leaf, leaf.view.renderer.nodes.length, 0, 0, () => {
      GraphInterface.applyOptions(leaf, preset.options);
      GraphInterface.applyPositions(leaf, preset.nodePositions);
    });
  }
  async delete(id) {
    const settings = this.getSettings();
    const idx = settings.presets.findIndex((p) => p.id === id);
    if (idx < 0)
      return;
    const name = settings.presets[idx].name;
    settings.presets.splice(idx, 1);
    if (settings.activePresetId === id) {
      settings.activePresetId = null;
    }
    await this.saveSettings();
    new import_obsidian2.Notice(`Preset "${name}" deleted`);
  }
  async rename(id, newName) {
    const preset = this.get(id);
    if (!preset)
      return;
    preset.name = newName;
    preset.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    await this.saveSettings();
  }
};

// src/settings-tab.ts
var import_obsidian3 = require("obsidian");
var GraphPresetsSettingTab = class extends import_obsidian3.PluginSettingTab {
  constructor(app, mgr, plugin) {
    super(app, plugin);
    this.mgr = mgr;
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Graph Presets" });
    const presets = this.mgr.list();
    if (presets.length === 0) {
      containerEl.createEl("p", {
        text: "No presets yet. Open a Graph View, set up filters/colors, then save.",
        cls: "setting-item-description"
      });
    } else {
      containerEl.createEl("h3", { text: "Saved Presets" });
      presets.forEach((preset) => this.renderPresetRow(containerEl, preset));
    }
    containerEl.createEl("h3", { text: "Actions" });
    new import_obsidian3.Setting(containerEl).setName("Save current Graph View").setDesc("Capture the active Graph View's filter, color groups, and node positions").addButton(
      (btn) => btn.setButtonText("Save as Preset").setClass("mod-cta").onClick(() => this.promptSave())
    );
    const activePreset = presets.find((p) => p.id === this.mgr.activePresetId);
    if (activePreset) {
      new import_obsidian3.Setting(containerEl).setName(`Update "${activePreset.name}"`).setDesc("Overwrite active preset with current Graph View state").addButton(
        (btn) => btn.setButtonText("Update").onClick(async () => {
          await this.mgr.updateCurrent(activePreset.id);
          this.display();
        })
      );
    }
    containerEl.createEl("h3", { text: "Settings" });
    new import_obsidian3.Setting(containerEl).setName("Restore on startup").setDesc("Automatically restore last active preset when opening Obsidian").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.restoreOnStartup).onChange(async (value) => {
        this.plugin.settings.restoreOnStartup = value;
        await this.plugin.saveData(this.plugin.settings);
      })
    );
  }
  renderPresetRow(containerEl, preset) {
    const isActive = this.mgr.activePresetId === preset.id;
    new import_obsidian3.Setting(containerEl).setName(isActive ? `\u2605 ${preset.name}` : preset.name).setDesc(
      `Filter: ${preset.options.search || "(none)"} \xB7 ${preset.options.colorGroups?.length ?? 0} color groups \xB7 ${preset.updatedAt.slice(0, 10)}`
    ).addButton(
      (btn) => btn.setButtonText(isActive ? "Active" : "Activate").setClass(isActive ? "mod-cta" : "").onClick(async () => {
        await this.mgr.activate(preset.id);
        this.display();
      })
    ).addExtraButton(
      (btn) => btn.setIcon("pencil").setTooltip("Rename").onClick(() => this.promptRename(preset))
    ).addExtraButton(
      (btn) => btn.setIcon("trash").setTooltip("Delete").onClick(async () => {
        await this.mgr.delete(preset.id);
        this.display();
      })
    );
  }
  promptSave() {
    const name = window.prompt("Preset name:");
    if (name)
      this.mgr.saveCurrent(name).then(() => this.display());
  }
  promptRename(preset) {
    const newName = window.prompt("New name:", preset.name);
    if (newName && newName !== preset.name) {
      this.mgr.rename(preset.id, newName).then(() => this.display());
    }
  }
};

// src/main.ts
var GraphPresetsPlugin = class extends import_obsidian4.Plugin {
  async onload() {
    await this.loadSettings();
    this.presetManager = new PresetManager(
      this.app,
      () => this.settings,
      async () => this.saveData(this.settings)
    );
    this.addCommand({
      id: "save-preset",
      name: "Save current graph as preset",
      callback: async () => {
        const name = `Preset ${this.settings.presets.length + 1}`;
        try {
          await this.presetManager.saveCurrent(name);
        } catch (e) {
          console.error(e.message);
        }
      }
    });
    this.addCommand({
      id: "restore-last-preset",
      name: "Restore last active preset",
      callback: () => this.presetManager.restoreLastActive()
    });
    this.addSettingTab(new GraphPresetsSettingTab(this.app, this.presetManager, this));
    this.registerEvent(
      this.app.workspace.on("layout-change", () => {
        const leaves = this.app.workspace.getLeavesOfType("graph");
        if (leaves.length > 0 && this.settings.restoreOnStartup) {
          setTimeout(() => this.presetManager.restoreLastActive(), 500);
        }
      })
    );
  }
  onunload() {
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};

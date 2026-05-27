import { App, Modal, Setting } from "obsidian";

export class RenameModal extends Modal {
  private result: string;
  private onSubmit: (result: string) => void;

  constructor(app: App, defaultVal: string, onSubmit: (result: string) => void) {
    super(app);
    this.result = defaultVal;
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h3", { text: "Rename Preset" });

    const setting = new Setting(contentEl)
      .setName("New Name")
      .addText((text) => {
        text.setValue(this.result).onChange((value) => {
          this.result = value;
        });
        
        text.inputEl.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            this.close();
            this.onSubmit(this.result.trim());
          }
        });

        // Auto focus and select input text
        setTimeout(() => {
          text.inputEl.focus();
          text.inputEl.select();
        }, 50);
      });

    new Setting(contentEl)
      .addButton((btn) =>
        btn
          .setButtonText("Cancel")
          .onClick(() => {
            this.close();
          })
      )
      .addButton((btn) =>
        btn
          .setButtonText("Save")
          .setCta()
          .onClick(() => {
            this.close();
            this.onSubmit(this.result.trim());
          })
      );
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

export class ConfirmModal extends Modal {
  private message: string;
  private onConfirm: () => void;

  constructor(app: App, message: string, onConfirm: () => void) {
    super(app);
    this.message = message;
    this.onConfirm = onConfirm;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h3", { text: "Confirm Action" });
    contentEl.createEl("p", { text: this.message });

    new Setting(contentEl)
      .addButton((btn) =>
        btn
          .setButtonText("Cancel")
          .onClick(() => {
            this.close();
          })
      )
      .addButton((btn) =>
        btn
          .setButtonText("Confirm")
          .setWarning()
          .onClick(() => {
            this.close();
            this.onConfirm();
          })
      );
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

"use babel";
import {$, CompositeDisposable} from "atom";
import path from "path";

module.exports = new class {

  constructor() {
    this.config = {};
  }

  activate() {
    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(atom.commands.add("atom-workspace", {
      "copy-path:copy-basename": (e) => this.copyBasename(e),
      "copy-path:copy-extension": (e) => this.copyExtension(e),
      "copy-path:copy-basename-wo-extension": (e) => this.copyBasenameWithoutExtension(e),
      "copy-path:copy-project-relative-path": (e) => this.copyProjectRelativePath(e),
      "copy-path:copy-full-path": (e) => this.copyFullPath(e),
      "copy-path:copy-base-dirname": (e) => this.copyBaseDirname(e),
      "copy-path:copy-project-relative-dirname": (e) => this.copyProjectRelativeDirname(e),
      "copy-path:copy-full-dirname": (e) => this.copyFullDirname(e),
      "copy-path:copy-line-reference": (e) => this.copyLineReference(e)
    }));
    if (process.platform === "win32") {
      this.activateForWin();
    }
  }

  activateForWin() {
    this.subscriptions.add(atom.commands.add("atom-workspace", {
      "copy-path:copy-project-relative-path-web": (e) => this.copyProjectRelativePathForWeb(e)
    }));
    atom.packages.onDidActivatePackage((pkg) => {
      if (pkg.name !== "copy-path") {
        return;
      }
      pkg.menuManager.add([
        {
          label: "Packages",
          submenu: [
            {
              label: "Copy Path",
              submenu: [
                {
                  label: "Copy Project-Relative Path for Web",
                  command: "copy-path:copy-project-relative-path-web"
                }
              ]
            }
          ]
        }
      ]);
      pkg.contextMenuManager.add({
        ".tab": [
          {
            label: "Copy Path",
            submenu: [
              {
                label: "Copy Project-Relative Path for Web",
                command: "copy-path:copy-project-relative-path-web"
              }
            ]
          }
        ]
      })
    });
  }

  deactivate() {
    this.subscriptions.dispose();
  }

  getTargetEditorPath(e) {
    // NOTE: DOM tree around a tab is like:
    //
    // ul.tab-bar
    //   li.tab ... (1)
    //     div.title[data-path=<absolute-path>] ... (2)
    //
    // Opening the context menu on the tab, the target element will be (1) or (2).

    // If the event was emitted by "context-menu".".tab" (see copy-path.cson),
    // e.currentTarget must be .tab element.
    if (e.currentTarget.classList.contains("tab")) {
      const elTitle = e.currentTarget.querySelector(".title");
      if (elTitle && elTitle.dataset.path) {
        return elTitle.dataset.path;
      }
    }

    // command palette etc.
    const item = atom.workspace.getActivePaneItem();
    if (!item) {
      return ""; // no active pane
    }
    return item.getPath ? item.getPath() : "";
  }

  writeToClipboardIfValid(str) {
    if (!str || str === "") {
      return;
    }
    atom.clipboard.write(str);
  }

  parseTargetEditorPath(e) {
    return path.parse(this.getTargetEditorPath(e));
  }

  getProjectRelativePath(p) {
    [projectPath, relativePath] = atom.project.relativizePath(p);
    return relativePath;
  }

  copyBasename(e) {
    const {base} = this.parseTargetEditorPath(e);
    this.writeToClipboardIfValid(base);
  }

  copyExtension(e) {
    const {ext} = this.parseTargetEditorPath(e);
    this.writeToClipboardIfValid(ext);
  }

  copyBasenameWithoutExtension(e) {
    const {name} = this.parseTargetEditorPath(e);
    this.writeToClipboardIfValid(name);
  }

  copyProjectRelativePath(e) {
    this.writeToClipboardIfValid(this.getProjectRelativePath(this.getTargetEditorPath(e)));
  }

  copyFullPath(e) {
    this.writeToClipboardIfValid(this.getTargetEditorPath(e));
  }

  copyBaseDirname(e) {
    const {dir} = this.parseTargetEditorPath(e);
    this.writeToClipboardIfValid(path.basename(dir));
  }

  copyProjectRelativeDirname(e) {
    const {dir} = this.parseTargetEditorPath(e);
    this.writeToClipboardIfValid(this.getProjectRelativePath(dir));
  }

  copyFullDirname(e) {
    const {dir} = this.parseTargetEditorPath(e);
    this.writeToClipboardIfValid(dir);
  }

  copyLineReference(e) {
    const editor = atom.workspace.getActiveTextEditor();
    const lineNumber = editor.getCursorBufferPosition().row + 1;
    const relativePath = this.getProjectRelativePath(editor.getPath());
    this.writeToClipboardIfValid(`${relativePath}:${lineNumber}`);
  }

  copyProjectRelativePathForWeb(e) {
    var path = this.getProjectRelativePath(this.getTargetEditorPath(e)).replace(/\\/g, '/');
    this.writeToClipboardIfValid(path);
  }
};

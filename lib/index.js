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
    // tab's context menu
    var elTarget;
    if (e.target.classList.contains("title")) {
      elTarget = e.target;
    } else {
      // find .tab
      for (let i = 0; i < 100; i++) {
        const el = e.target.parentElement;
        if (el && el.classList.contains("tab")) {
          elTarget = el.querySelector(".title");
        }
      }
    }
    if (elTarget) {
      return elTarget.dataset.path;
    }
    // command palette etc.
    return atom.workspace.getActivePaneItem().getPath();
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
    atom.clipboard.write(base);
  }

  copyExtension(e) {
    const {ext} = this.parseTargetEditorPath(e);
    atom.clipboard.write(ext);
  }

  copyBasenameWithoutExtension(e) {
    const {name} = this.parseTargetEditorPath(e);
    atom.clipboard.write(name);
  }

  copyProjectRelativePath(e) {
    atom.clipboard.write(this.getProjectRelativePath(this.getTargetEditorPath(e)));
  }

  copyFullPath(e) {
    atom.clipboard.write(this.getTargetEditorPath(e));
  }

  copyBaseDirname(e) {
    const {dir} = this.parseTargetEditorPath(e);
    atom.clipboard.write(path.basename(dir));
  }

  copyProjectRelativeDirname(e) {
    const {dir} = this.parseTargetEditorPath(e);
    atom.clipboard.write(this.getProjectRelativePath(dir));
  }

  copyFullDirname(e) {
    const {dir} = this.parseTargetEditorPath(e);
    atom.clipboard.write(dir);
  }

  copyLineReference(e) {
    const editor = atom.workspace.getActiveTextEditor();
    const lineNumber = editor.getCursorBufferPosition().row + 1;
    const relativePath = this.getProjectRelativePath(editor.getPath());
    atom.clipboard.write(`${relativePath}:${lineNumber}`);
  }

  copyProjectRelativePathForWeb(e) {
    var path = this.getProjectRelativePath(this.getTargetEditorPath(e)).replace(/\\/g, '/');
    atom.clipboard.write(path);
  }
};

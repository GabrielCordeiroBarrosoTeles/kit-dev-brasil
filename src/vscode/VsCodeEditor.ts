import * as vscode from 'vscode';
import type { CursorLine, IEditor, IEditorProvider } from './types';

export class VsCodeEditor implements IEditor {
  constructor(private readonly editor: vscode.TextEditor) {}

  selectedTexts(): readonly string[] {
    return this.editor.selections.map((selection) => this.editor.document.getText(selection));
  }

  cursorLine(): CursorLine {
    const { active } = this.editor.selection;
    return { text: this.editor.document.lineAt(active.line).text, column: active.character };
  }

  async replaceSelections(replacements: readonly (string | undefined)[]): Promise<void> {
    const selections = this.editor.selections;
    await this.editor.edit((builder) => {
      selections.forEach((selection, index) => {
        const replacement = replacements[index];
        if (replacement !== undefined) {
          builder.replace(selection, replacement);
        }
      });
    });
  }
}

export class ActiveEditorProvider implements IEditorProvider {
  active(): VsCodeEditor | undefined {
    const editor = vscode.window.activeTextEditor;
    return editor ? new VsCodeEditor(editor) : undefined;
  }
}

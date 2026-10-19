import * as vscode from 'vscode';
import type { IClipboard, IMarkdownPresenter, INotifier, ISettings } from './types';

export const CONFIGURATION_SECTION = 'kitDevBrasil';

export class VsCodeSettings implements ISettings {
  get generateFormatted(): boolean {
    return this.read('generate.formatted');
  }

  get hoverEnabled(): boolean {
    return this.read('hover.enabled');
  }

  private read(key: string): boolean {
    return vscode.workspace.getConfiguration(CONFIGURATION_SECTION).get<boolean>(key, true);
  }
}

export class VsCodeNotifier implements INotifier {
  async info(message: string, ...actions: string[]): Promise<string | undefined> {
    return vscode.window.showInformationMessage(message, ...actions);
  }

  warn(message: string): void {
    void vscode.window.showWarningMessage(message);
  }
}

export class VsCodeMarkdownPresenter implements IMarkdownPresenter {
  async show(content: string): Promise<void> {
    const document = await vscode.workspace.openTextDocument({ language: 'markdown', content });
    await vscode.window.showTextDocument(document, { viewColumn: vscode.ViewColumn.Beside, preview: true });
  }
}

export class VsCodeClipboard implements IClipboard {
  async writeText(text: string): Promise<void> {
    await vscode.env.clipboard.writeText(text);
  }
}

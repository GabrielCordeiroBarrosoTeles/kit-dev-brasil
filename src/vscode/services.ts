import * as vscode from 'vscode';
import type { IClipboard, IDocumentOpener, IInputPrompt, IMarkdownPresenter, INotifier, InputFeedback, InputRequest, IQuickPick, ISettings, PickEntry } from './types';

export const CONFIGURATION_SECTION = 'kitDevBrasil';

const BATCH_TEMPLATES_KEY = 'batch.templates';

export class VsCodeSettings implements ISettings {
  get generateFormatted(): boolean {
    return this.read('generate.formatted');
  }

  get hoverEnabled(): boolean {
    return this.read('hover.enabled');
  }

  async setGenerateFormatted(value: boolean): Promise<void> {
    await vscode.workspace.getConfiguration(CONFIGURATION_SECTION).update('generate.formatted', value, vscode.ConfigurationTarget.Global);
  }

  get batchTemplates(): Readonly<Record<string, unknown>> {
    return vscode.workspace.getConfiguration(CONFIGURATION_SECTION).get<Record<string, unknown>>(BATCH_TEMPLATES_KEY, {});
  }

  async saveBatchTemplate(name: string, template: unknown): Promise<void> {
    const target = (vscode.workspace.workspaceFolders ?? []).length > 0 ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global;
    await vscode.workspace.getConfiguration(CONFIGURATION_SECTION).update(BATCH_TEMPLATES_KEY, { ...this.batchTemplates, [name]: template }, target);
  }

  private read(key: string): boolean {
    return vscode.workspace.getConfiguration(CONFIGURATION_SECTION).get<boolean>(key, true);
  }
}

const STATUS_TIMEOUT_MS = 3000;

export class VsCodeNotifier implements INotifier {
  async info(message: string, ...actions: string[]): Promise<string | undefined> {
    return vscode.window.showInformationMessage(message, ...actions);
  }

  warn(message: string): void {
    void vscode.window.showWarningMessage(message);
  }

  status(message: string): void {
    vscode.window.setStatusBarMessage(`$(check) ${message}`, STATUS_TIMEOUT_MS);
  }
}

export class VsCodeMarkdownPresenter implements IMarkdownPresenter {
  async show(content: string): Promise<void> {
    const document = await vscode.workspace.openTextDocument({ language: 'markdown', content });
    await vscode.window.showTextDocument(document, { viewColumn: vscode.ViewColumn.Beside, preview: true });
  }
}

export class VsCodeDocumentOpener implements IDocumentOpener {
  async open(content: string, language: string): Promise<void> {
    const document = await vscode.workspace.openTextDocument({ language, content });
    await vscode.window.showTextDocument(document, { preview: false });
  }
}

export class VsCodeClipboard implements IClipboard {
  async writeText(text: string): Promise<void> {
    await vscode.env.clipboard.writeText(text);
  }
}

const toValidationMessage = (feedback: InputFeedback): vscode.InputBoxValidationMessage => ({
  message: `${feedback.valid ? '✅' : '❌'} ${feedback.message}`,
  severity: feedback.valid ? vscode.InputBoxValidationSeverity.Info : vscode.InputBoxValidationSeverity.Warning,
});

export class VsCodeInputPrompt implements IInputPrompt {
  async ask({ title, placeholder, value, feedback }: InputRequest): Promise<string | undefined> {
    return vscode.window.showInputBox({
      title,
      placeHolder: placeholder,
      value,
      ignoreFocusOut: true,
      validateInput: (text) => {
        const result = feedback(text);
        return result && toValidationMessage(result);
      },
    });
  }
}

interface ValuedItem<T> extends vscode.QuickPickItem {
  readonly value?: T;
}

const toQuickPickItem = <T>(entry: PickEntry<T>): ValuedItem<T> =>
  'separator' in entry ? { label: entry.separator, kind: vscode.QuickPickItemKind.Separator } : { label: entry.label, value: entry.value };

export class VsCodeQuickPick implements IQuickPick {
  async pick<T>(entries: readonly PickEntry<T>[], placeholder: string): Promise<T | undefined> {
    const choice = await vscode.window.showQuickPick(entries.map(toQuickPickItem), { placeHolder: placeholder, matchOnDescription: true });
    return choice?.value;
  }
}

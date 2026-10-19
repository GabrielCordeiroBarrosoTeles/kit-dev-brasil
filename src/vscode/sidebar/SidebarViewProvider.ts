import { randomBytes } from 'node:crypto';
import * as vscode from 'vscode';
import type { GeneratedValues } from '../../application/generation/GeneratedValues';
import type { GeneratorId } from '../../application/generation/generatorIds';
import { GENERATOR_IDS, isGeneratorId } from '../../application/generation/generatorIds';
import type { BrCodeDecoder, TextInspector } from '../../application/inspection/TextInspector';
import type { InspectionRenderer } from '../../presentation/InspectionRenderer';
import { EMPTY_DOCUMENT_VIEW, EMPTY_PIX_VIEW, toDocumentView, toPixView } from '../../presentation/sidebarViews';
import type { HostToSidebarMessage, SidebarState, SidebarToHostMessage } from '../../shared/sidebarProtocol';
import type { ICommand } from '../commands/types';
import { COMMAND_MESSAGES } from '../commands/messages';
import type { PixReport } from '../commands/PixReport';
import type { IClipboard, INotifier, ISettings } from '../types';
import { renderSidebarHtml } from './sidebarHtml';

export interface SidebarServices {
  readonly values: GeneratedValues<GeneratorId>;
  readonly settings: ISettings;
  readonly inspector: TextInspector;
  readonly renderer: InspectionRenderer;
  readonly decode: BrCodeDecoder;
  readonly report: PixReport;
  readonly clipboard: IClipboard;
  readonly notifier: INotifier;
  readonly formatSelection: ICommand;
  readonly unformatSelection: ICommand;
}

type Handlers = {
  [K in SidebarToHostMessage['type']]: (message: Extract<SidebarToHostMessage, { type: K }>) => Promise<void> | void;
};

const MESSAGE_TYPES: ReadonlySet<string> = new Set<SidebarToHostMessage['type']>([
  'ready',
  'generate',
  'copy-generated',
  'set-formatted',
  'validate',
  'copy-formatted',
  'inspect-pix',
  'open-pix-report',
  'copy-pix-json',
  'format-selection',
  'unformat-selection',
]);

const isSidebarMessage = (value: unknown): value is SidebarToHostMessage =>
  typeof value === 'object' && value !== null && MESSAGE_TYPES.has(String((value as { type?: unknown }).type));

const createNonce = (): string => randomBytes(16).toString('base64');

export class SidebarViewProvider implements vscode.WebviewViewProvider, vscode.Disposable {
  private view: vscode.WebviewView | undefined;
  private readonly unsubscribe: () => void;

  private readonly handlers: Handlers = {
    ready: () => this.postState(),
    generate: ({ id }) => this.copyGenerated(id, true),
    'copy-generated': ({ id }) => this.copyGenerated(id, false),
    'set-formatted': ({ value }) => this.setFormatted(value),
    validate: ({ text }) => this.validate(text),
    'copy-formatted': ({ text }) => this.copyFormatted(text),
    'inspect-pix': ({ text }) => this.inspectPix(text),
    'open-pix-report': ({ text }) => this.services.report.present(text.trim()),
    'copy-pix-json': ({ text }) => this.copyPixJson(text),
    'format-selection': () => this.services.formatSelection.execute(),
    'unformat-selection': () => this.services.unformatSelection.execute(),
  };

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly services: SidebarServices,
    private readonly nonce: () => string = createNonce,
  ) {
    this.unsubscribe = services.values.onDidChange(() => this.postState());
  }

  resolveWebviewView(view: vscode.WebviewView): void {
    this.view = view;
    const distRoot = vscode.Uri.joinPath(this.extensionUri, 'dist');
    view.webview.options = { enableScripts: true, localResourceRoots: [distRoot] };
    view.webview.html = renderSidebarHtml({
      cspSource: view.webview.cspSource,
      scriptUri: view.webview.asWebviewUri(vscode.Uri.joinPath(distRoot, 'sidebar.js')).toString(),
      styleUri: view.webview.asWebviewUri(vscode.Uri.joinPath(distRoot, 'sidebar.css')).toString(),
      nonce: this.nonce(),
    });
    view.webview.onDidReceiveMessage((message: unknown) => this.receive(message));
    view.onDidDispose(() => {
      this.view = undefined;
    });
  }

  dispose(): void {
    this.unsubscribe();
  }

  private async receive(message: unknown): Promise<void> {
    if (isSidebarMessage(message)) {
      await (this.handlers[message.type] as (value: SidebarToHostMessage) => Promise<void> | void)(message);
    }
  }

  private post(message: HostToSidebarMessage): void {
    void this.view?.webview.postMessage(message);
  }

  private state(): SidebarState {
    const generated = Object.fromEntries(GENERATOR_IDS.map((id) => [id, this.services.values.current(id)])) as Record<GeneratorId, string | undefined>;
    return { generated, formatted: this.services.settings.generateFormatted };
  }

  private postState(): void {
    this.post({ type: 'state', state: this.state() });
  }

  private async copyGenerated(id: GeneratorId, regenerate: boolean): Promise<void> {
    if (!isGeneratorId(id)) {
      return;
    }
    const { values, settings, clipboard, notifier } = this.services;
    const value = regenerate ? values.next(id, settings.generateFormatted) : values.currentOrNext(id, settings.generateFormatted);
    await clipboard.writeText(value);
    notifier.status(COMMAND_MESSAGES.copied(values.label(id), value));
  }

  private async setFormatted(value: boolean): Promise<void> {
    await this.services.settings.setGenerateFormatted(value === true);
    this.postState();
  }

  private validate(text: string): void {
    const trimmed = String(text).trim();
    const view = trimmed === '' ? EMPTY_DOCUMENT_VIEW : toDocumentView(this.services.inspector.inspectDocument(trimmed), this.services.renderer);
    this.post({ type: 'document-result', view });
  }

  private async copyFormatted(text: string): Promise<void> {
    const inspection = this.services.inspector.inspectDocument(String(text).trim());
    if (inspection) {
      await this.services.clipboard.writeText(inspection.formatted);
      this.services.notifier.status(COMMAND_MESSAGES.formattedCopied(inspection.formatted));
    }
  }

  private inspectPix(text: string): void {
    const trimmed = String(text).trim();
    const view = trimmed === '' ? EMPTY_PIX_VIEW : toPixView(this.services.decode(trimmed), this.services.renderer);
    this.post({ type: 'pix-result', view });
  }

  private async copyPixJson(text: string): Promise<void> {
    await this.services.clipboard.writeText(JSON.stringify(this.services.decode(String(text).trim()), null, 2));
    this.services.notifier.status(COMMAND_MESSAGES.jsonCopied);
  }
}

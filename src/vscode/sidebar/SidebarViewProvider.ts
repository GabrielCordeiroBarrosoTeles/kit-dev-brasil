import { randomBytes } from 'node:crypto';
import * as vscode from 'vscode';
import type { GeneratedValues } from '../../application/generation/GeneratedValues';
import type { GeneratorId } from '../../application/generation/generatorIds';
import { GENERATOR_IDS, isGeneratorId } from '../../application/generation/generatorIds';
import type { BoletoDecoder, BrCodeDecoder, TextInspector } from '../../application/inspection/TextInspector';
import { generateStaticPix } from '../../application/pix/generateStaticPix';
import type { PixForm } from '../../application/pix/generateStaticPix';
import { describePixFormIssue } from '../../presentation/messages';
import type { InspectionRenderer } from '../../presentation/InspectionRenderer';
import { summarizeCandidates } from '../../presentation/candidateSummary';
import { EMPTY_DOCUMENT_VIEW, EMPTY_INSPECTION_VIEW, toBoletoView, toDocumentView, toPixView } from '../../presentation/sidebarViews';
import type { BoletoFormatChoice, HostToSidebarMessage, SidebarState, SidebarToHostMessage } from '../../shared/sidebarProtocol';
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
  readonly decodeBoleto: BoletoDecoder;
  readonly qrCode: (text: string) => string;
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
  'inspect-boleto',
  'copy-boleto',
  'generate-pix',
  'copy-text',
  'format-selection',
  'unformat-selection',
]);

const isSidebarMessage = (value: unknown): value is SidebarToHostMessage =>
  typeof value === 'object' && value !== null && MESSAGE_TYPES.has(String((value as { type?: unknown }).type));

const MAX_COPY_LENGTH = 2000;

const field = (form: unknown, name: keyof PixForm): string => {
  const value = typeof form === 'object' && form !== null ? (form as Record<string, unknown>)[name] : undefined;
  return typeof value === 'string' ? value : '';
};

const toPixForm = (form: unknown): PixForm => ({
  key: field(form, 'key'),
  merchantName: field(form, 'merchantName'),
  merchantCity: field(form, 'merchantCity'),
  amount: field(form, 'amount'),
  txid: field(form, 'txid'),
});

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
    'inspect-boleto': ({ text }) => this.inspectBoleto(text),
    'copy-boleto': ({ text, format }) => this.copyBoleto(text, format),
    'generate-pix': ({ form }) => this.generatePix(form),
    'copy-text': ({ text }) => this.copyText(text),
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
    const view = trimmed === '' ? EMPTY_DOCUMENT_VIEW : toDocumentView(this.services.inspector.inspectCandidates(trimmed), this.services.renderer);
    this.post({ type: 'document-result', view });
  }

  private async copyFormatted(text: string): Promise<void> {
    const { formatted } = summarizeCandidates(this.services.inspector.inspectCandidates(String(text).trim()), this.services.renderer);
    if (formatted !== undefined) {
      await this.services.clipboard.writeText(formatted);
      this.services.notifier.status(COMMAND_MESSAGES.formattedCopied(formatted));
    }
  }

  private inspectPix(text: string): void {
    const trimmed = String(text).trim();
    const view = trimmed === '' ? EMPTY_INSPECTION_VIEW : toPixView(this.services.decode(trimmed), this.services.renderer);
    this.post({ type: 'pix-result', view });
  }

  private inspectBoleto(text: string): void {
    const trimmed = String(text).trim();
    const view = trimmed === '' ? EMPTY_INSPECTION_VIEW : toBoletoView(this.services.decodeBoleto(trimmed), this.services.renderer);
    this.post({ type: 'boleto-result', view });
  }

  private async copyBoleto(text: string, format: BoletoFormatChoice): Promise<void> {
    const { boleto } = this.services.decodeBoleto(String(text).trim());
    if (boleto) {
      await this.services.clipboard.writeText(format === 'barcode' ? boleto.barcode : boleto.line);
      this.services.notifier.status(COMMAND_MESSAGES.boletoCopied(format === 'barcode' ? 'barcode' : 'line'));
    }
  }

  private generatePix(form: PixForm): void {
    const { code, issues } = generateStaticPix(toPixForm(form));
    const view = { code, qrDataUrl: code === undefined ? undefined : this.services.qrCode(code), issues: issues.map(describePixFormIssue) };
    this.post({ type: 'pix-generated', view });
  }

  private async copyText(text: string): Promise<void> {
    if (typeof text === 'string' && text !== '' && text.length <= MAX_COPY_LENGTH) {
      await this.services.clipboard.writeText(text);
      this.services.notifier.status(COMMAND_MESSAGES.textCopied);
    }
  }

  private async copyPixJson(text: string): Promise<void> {
    await this.services.clipboard.writeText(JSON.stringify(this.services.decode(String(text).trim()), null, 2));
    this.services.notifier.status(COMMAND_MESSAGES.jsonCopied);
  }
}

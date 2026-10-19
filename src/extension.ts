import * as vscode from 'vscode';
import { DocumentGenerator } from './application/generation/DocumentGenerator';
import { GeneratedValues } from './application/generation/GeneratedValues';
import type { GeneratorId } from './application/generation/generatorIds';
import { TextInspector } from './application/inspection/TextInspector';
import { TokenScanner } from './application/scanning/TokenScanner';
import { TextTransformer } from './application/transform/TextTransformer';
import { Cnpj } from './domain/documents/Cnpj';
import { Cpf } from './domain/documents/Cpf';
import { DocumentRegistry } from './domain/documents/DocumentRegistry';
import { decodeBrCode } from './domain/pix/decodeBrCode';
import { CryptoRandomSource } from './infrastructure/CryptoRandomSource';
import { InspectionRenderer } from './presentation/InspectionRenderer';
import { COMMAND_IDS } from './vscode/commands/commandIds';
import { GenerateDocumentCommand } from './vscode/commands/GenerateDocumentCommand';
import { InspectPixInputCommand, ValidateInputCommand } from './vscode/commands/InputCommands';
import { InspectPixCommand } from './vscode/commands/InspectPixCommand';
import { COMMAND_MESSAGES } from './vscode/commands/messages';
import { PixReport } from './vscode/commands/PixReport';
import { registerCommands } from './vscode/commands/registerCommands';
import { TransformSelectionCommand } from './vscode/commands/TransformSelectionCommand';
import { ValidateSelectionCommand } from './vscode/commands/ValidateSelectionCommand';
import { KitHoverProvider } from './vscode/KitHoverProvider';
import { VsCodeClipboard, VsCodeInputPrompt, VsCodeMarkdownPresenter, VsCodeNotifier, VsCodeSettings } from './vscode/services';
import { SidebarViewProvider } from './vscode/sidebar/SidebarViewProvider';
import { ActiveEditorProvider } from './vscode/VsCodeEditor';

const HOVER_SELECTOR: vscode.DocumentSelector = [{ scheme: 'file' }, { scheme: 'untitled' }];
const SIDEBAR_VIEW_ID = 'kitDevBrasil.tools';

export function activate(context: vscode.ExtensionContext): void {
  const cpf = new Cpf();
  const cnpj = new Cnpj();
  const documents = new DocumentRegistry([cpf, cnpj]);
  const scanner = new TokenScanner();
  const inspector = new TextInspector(documents, decodeBrCode);
  const renderer = new InspectionRenderer();
  const transformer = new TextTransformer(documents);
  const settings = new VsCodeSettings();
  const editors = new ActiveEditorProvider();
  const notifier = new VsCodeNotifier();
  const clipboard = new VsCodeClipboard();
  const prompt = new VsCodeInputPrompt();
  const report = new PixReport({ decode: decodeBrCode, renderer, presenter: new VsCodeMarkdownPresenter(), clipboard, notifier });
  const generator = new DocumentGenerator<GeneratorId>(
    {
      cpf: { label: 'CPF', type: cpf, generate: (random) => cpf.generate(random) },
      cnpj: { label: 'CNPJ', type: cnpj, generate: (random) => cnpj.generate(random) },
      alphanumericCnpj: { label: 'CNPJ alfanumérico', type: cnpj, generate: (random) => cnpj.generateAlphanumeric(random) },
    },
    new CryptoRandomSource(),
  );

  const formatSelection = new TransformSelectionCommand(
    COMMAND_IDS.formatSelection,
    (text) => transformer.format(text),
    COMMAND_MESSAGES.nothingToFormat,
    editors,
    notifier,
  );
  const unformatSelection = new TransformSelectionCommand(
    COMMAND_IDS.unformatSelection,
    (text) => transformer.unformat(text),
    COMMAND_MESSAGES.nothingToUnformat,
    editors,
    notifier,
  );
  const commands = [
    new GenerateDocumentCommand(COMMAND_IDS.generateCpf, 'cpf', generator, settings, clipboard, editors, notifier),
    new GenerateDocumentCommand(COMMAND_IDS.generateCnpj, 'cnpj', generator, settings, clipboard, editors, notifier),
    new GenerateDocumentCommand(COMMAND_IDS.generateAlphanumericCnpj, 'alphanumericCnpj', generator, settings, clipboard, editors, notifier),
    formatSelection,
    unformatSelection,
    new ValidateSelectionCommand(COMMAND_IDS.validateSelection, inspector, renderer, editors, notifier),
    new InspectPixCommand(COMMAND_IDS.inspectPix, scanner, report, editors, notifier),
    new ValidateInputCommand(COMMAND_IDS.validateInput, { inspector, renderer, prompt, editors, clipboard, notifier }),
    new InspectPixInputCommand(COMMAND_IDS.inspectPixInput, { scanner, report, prompt, editors }),
  ];

  const sidebar = new SidebarViewProvider(context.extensionUri, {
    values: new GeneratedValues(generator),
    settings,
    inspector,
    renderer,
    decode: decodeBrCode,
    report,
    clipboard,
    notifier,
    formatSelection,
    unformatSelection,
  });

  context.subscriptions.push(
    ...registerCommands(commands),
    vscode.languages.registerHoverProvider(HOVER_SELECTOR, new KitHoverProvider(scanner, inspector, renderer, settings)),
    sidebar,
    vscode.window.registerWebviewViewProvider(SIDEBAR_VIEW_ID, sidebar),
  );
}

export function deactivate(): void {}

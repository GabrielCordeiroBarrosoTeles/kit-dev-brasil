import * as vscode from 'vscode';
import { createDocumentCatalog } from './application/catalog';
import { DocumentGenerator } from './application/generation/DocumentGenerator';
import { GeneratedValues } from './application/generation/GeneratedValues';
import type { GeneratorId } from './application/generation/generatorIds';
import { TextInspector } from './application/inspection/TextInspector';
import { TokenScanner } from './application/scanning/TokenScanner';
import { TextTransformer } from './application/transform/TextTransformer';
import { DocumentRegistry } from './domain/documents/DocumentRegistry';
import { convertBoleto } from './domain/boleto/convertBoleto';
import { decodeBoleto } from './domain/boleto/decodeBoleto';
import { decodeBrCode } from './domain/pix/decodeBrCode';
import { CryptoRandomSource } from './infrastructure/CryptoRandomSource';
import { qrCodeDataUrl } from './infrastructure/qrCode';
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
import { GENERATOR_GROUPS } from './shared/generatorCatalog';
import { PickGeneratorCommand } from './vscode/commands/PickGeneratorCommand';
import { VsCodeClipboard, VsCodeInputPrompt, VsCodeMarkdownPresenter, VsCodeNotifier, VsCodeQuickPick, VsCodeSettings } from './vscode/services';
import { SidebarViewProvider } from './vscode/sidebar/SidebarViewProvider';
import { ActiveEditorProvider } from './vscode/VsCodeEditor';

const HOVER_SELECTOR: vscode.DocumentSelector = [{ scheme: 'file' }, { scheme: 'untitled' }];
const SIDEBAR_VIEW_ID = 'kitDevBrasil.tools';

export function activate(context: vscode.ExtensionContext): void {
  const catalog = createDocumentCatalog();
  const documents = new DocumentRegistry(catalog.types);
  const scanner = new TokenScanner();
  const today = (): Date => new Date();
  const inspector = new TextInspector(documents, decodeBrCode, (text) => decodeBoleto(text, today()));
  const renderer = new InspectionRenderer(today);
  const transformer = new TextTransformer(documents);
  const settings = new VsCodeSettings();
  const editors = new ActiveEditorProvider();
  const notifier = new VsCodeNotifier();
  const clipboard = new VsCodeClipboard();
  const prompt = new VsCodeInputPrompt();
  const report = new PixReport({ decode: decodeBrCode, renderer, presenter: new VsCodeMarkdownPresenter(), clipboard, notifier });
  const generator = new DocumentGenerator<GeneratorId>(catalog.generators, new CryptoRandomSource());

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
  const generateCommand = (commandId: string, generatorId: GeneratorId) =>
    new GenerateDocumentCommand(commandId, generatorId, generator, settings, clipboard, editors, notifier);
  const commands = [
    generateCommand(COMMAND_IDS.generateCpf, 'cpf'),
    generateCommand(COMMAND_IDS.generateCnpj, 'cnpj'),
    generateCommand(COMMAND_IDS.generateAlphanumericCnpj, 'alphanumericCnpj'),
    new PickGeneratorCommand(COMMAND_IDS.generateDocument, new VsCodeQuickPick(), GENERATOR_GROUPS, (id) => generateCommand(COMMAND_IDS.generateDocument, id).execute()),
    formatSelection,
    unformatSelection,
    new TransformSelectionCommand(COMMAND_IDS.convertBoleto, (text) => convertBoleto(text, today()), COMMAND_MESSAGES.nothingToConvert, editors, notifier),
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
    decodeBoleto: (text) => decodeBoleto(text, today()),
    qrCode: qrCodeDataUrl,
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

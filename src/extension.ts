import * as vscode from 'vscode';
import { DocumentGenerator } from './application/generation/DocumentGenerator';
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
import { InspectPixCommand } from './vscode/commands/InspectPixCommand';
import { COMMAND_MESSAGES } from './vscode/commands/messages';
import { registerCommands } from './vscode/commands/registerCommands';
import { TransformSelectionCommand } from './vscode/commands/TransformSelectionCommand';
import { ValidateSelectionCommand } from './vscode/commands/ValidateSelectionCommand';
import { KitHoverProvider } from './vscode/KitHoverProvider';
import { VsCodeClipboard, VsCodeMarkdownPresenter, VsCodeNotifier, VsCodeSettings } from './vscode/services';
import { ActiveEditorProvider } from './vscode/VsCodeEditor';

const HOVER_SELECTOR: vscode.DocumentSelector = [{ scheme: 'file' }, { scheme: 'untitled' }];

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
  const generator = new DocumentGenerator(
    {
      cpf: { type: cpf, generate: (random) => cpf.generate(random) },
      cnpj: { type: cnpj, generate: (random) => cnpj.generate(random) },
      alphanumericCnpj: { type: cnpj, generate: (random) => cnpj.generateAlphanumeric(random) },
    },
    new CryptoRandomSource(),
  );

  const commands = [
    new GenerateDocumentCommand(COMMAND_IDS.generateCpf, 'cpf', generator, settings, editors, notifier),
    new GenerateDocumentCommand(COMMAND_IDS.generateCnpj, 'cnpj', generator, settings, editors, notifier),
    new GenerateDocumentCommand(COMMAND_IDS.generateAlphanumericCnpj, 'alphanumericCnpj', generator, settings, editors, notifier),
    new TransformSelectionCommand(COMMAND_IDS.formatSelection, (text) => transformer.format(text), COMMAND_MESSAGES.nothingToFormat, editors, notifier),
    new TransformSelectionCommand(COMMAND_IDS.unformatSelection, (text) => transformer.unformat(text), COMMAND_MESSAGES.nothingToUnformat, editors, notifier),
    new ValidateSelectionCommand(COMMAND_IDS.validateSelection, inspector, renderer, editors, notifier),
    new InspectPixCommand(
      COMMAND_IDS.inspectPix,
      { scanner, decode: decodeBrCode, renderer, presenter: new VsCodeMarkdownPresenter(), clipboard: new VsCodeClipboard() },
      editors,
      notifier,
    ),
  ];

  context.subscriptions.push(
    ...registerCommands(commands),
    vscode.languages.registerHoverProvider(HOVER_SELECTOR, new KitHoverProvider(scanner, inspector, renderer, settings)),
  );
}

export function deactivate(): void {}

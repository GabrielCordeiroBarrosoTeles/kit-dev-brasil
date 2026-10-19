import { beforeEach, describe, expect, it, vi } from 'vitest';
import { decodeTestBoleto } from '../fakes/boleto';
import * as vscode from 'vscode';
import { TextInspector } from '../../src/application/inspection/TextInspector';
import { TokenScanner } from '../../src/application/scanning/TokenScanner';
import { Cnpj } from '../../src/domain/documents/Cnpj';
import { Cpf } from '../../src/domain/documents/Cpf';
import { DocumentRegistry } from '../../src/domain/documents/DocumentRegistry';
import { decodeBrCode } from '../../src/domain/pix/decodeBrCode';
import { activate, deactivate } from '../../src/extension';
import { InspectionRenderer } from '../../src/presentation/InspectionRenderer';
import { COMMAND_IDS } from '../../src/vscode/commands/commandIds';
import { registerCommands } from '../../src/vscode/commands/registerCommands';
import { KitHoverProvider } from '../../src/vscode/KitHoverProvider';
import { SidebarViewProvider } from '../../src/vscode/sidebar/SidebarViewProvider';
import { VsCodeClipboard, VsCodeInputPrompt, VsCodeMarkdownPresenter, VsCodeNotifier, VsCodeQuickPick, VsCodeSettings } from '../../src/vscode/services';
import { ActiveEditorProvider, VsCodeEditor } from '../../src/vscode/VsCodeEditor';
import { commandHandlers, configuration, configurationUpdates, window as mockWindow, resetVscodeMock, Uri } from '../mocks/vscode';
import { fakeSettings } from '../fakes/FakeEditor';
import { BCB_PIX, OFFICIAL_BANK_BARCODE, OFFICIAL_BANK_LINE, VALID_CPF, VALID_CPF_DIGITS } from '../fakes/samples';

interface FakeSelection {
  readonly text: string;
  readonly active: { readonly line: number; readonly character: number };
}

const textEditor = (lines: readonly string[], selections: readonly FakeSelection[]) => {
  const replaced: [FakeSelection, string][] = [];
  return {
    replaced,
    selections,
    selection: selections[0],
    document: {
      getText: (selection: FakeSelection) => selection.text,
      lineAt: (line: number) => ({ text: lines[line] }),
    },
    edit: vi.fn((build: (builder: { replace: (selection: FakeSelection, text: string) => void }) => void) => {
      build({ replace: (selection, text) => replaced.push([selection, text]) });
      return Promise.resolve(true);
    }),
  };
};

const hoverDocument = (line: string) => ({ lineAt: () => ({ text: line }) }) as unknown as vscode.TextDocument;

const position = (character: number) => ({ line: 3, character }) as vscode.Position;

beforeEach(() => {
  resetVscodeMock();
});

describe('VsCodeEditor', () => {
  it('reads selections and the cursor line and replaces selected text', async () => {
    const first = { text: 'a', active: { line: 1, character: 2 } };
    const second = { text: 'b', active: { line: 0, character: 0 } };
    const raw = textEditor(['zero', 'one line'], [first, second]);
    const editor = new VsCodeEditor(raw as unknown as vscode.TextEditor);
    expect(editor.selectedTexts()).toEqual(['a', 'b']);
    expect(editor.cursorLine()).toEqual({ text: 'one line', column: 2 });
    await editor.replaceSelections(['A', undefined]);
    expect(raw.replaced).toEqual([[first, 'A']]);
  });

  it('wraps the active editor only when there is one', () => {
    const provider = new ActiveEditorProvider();
    expect(provider.active()).toBeUndefined();
    (vscode.window as { activeTextEditor: unknown }).activeTextEditor = textEditor([''], []);
    expect(provider.active()).toBeInstanceOf(VsCodeEditor);
  });
});

describe('services', () => {
  it('reads settings with defaults and writes the mask preference', async () => {
    const settings = new VsCodeSettings();
    expect([settings.generateFormatted, settings.hoverEnabled]).toEqual([true, true]);
    configuration.set('kitDevBrasil.generate.formatted', false);
    configuration.set('kitDevBrasil.hover.enabled', false);
    expect([settings.generateFormatted, settings.hoverEnabled]).toEqual([false, false]);
    await settings.setGenerateFormatted(true);
    expect(configurationUpdates).toEqual([['kitDevBrasil', 'generate.formatted', true, vscode.ConfigurationTarget.Global]]);
  });

  it('shows messages, markdown and writes to the clipboard', async () => {
    const notifier = new VsCodeNotifier();
    await notifier.info('oi', 'A');
    notifier.warn('cuidado');
    notifier.status('copiado');
    expect(vscode.window.setStatusBarMessage).toHaveBeenCalledWith('$(check) copiado', 3000);
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith('oi', 'A');
    expect(vscode.window.showWarningMessage).toHaveBeenCalledWith('cuidado');
    await new VsCodeMarkdownPresenter().show('# PIX');
    expect(vscode.workspace.openTextDocument).toHaveBeenCalledWith({ language: 'markdown', content: '# PIX' });
    expect(vscode.window.showTextDocument).toHaveBeenCalledWith(expect.objectContaining({ content: '# PIX' }), { viewColumn: vscode.ViewColumn.Beside, preview: true });
    await new VsCodeClipboard().writeText('json');
    expect(vscode.env.clipboard.writeText).toHaveBeenCalledWith('json');
  });
});

describe('VsCodeQuickPick', () => {
  it('maps separators and returns the chosen value', async () => {
    const choice = await new VsCodeQuickPick().pick([{ separator: 'Pessoa' }, { label: 'CPF', value: 'cpf' }], 'Qual?');
    expect(choice).toBe('cpf');
    expect(mockWindow.showQuickPick).toHaveBeenCalledWith(
      [
        { label: 'Pessoa', kind: vscode.QuickPickItemKind.Separator },
        { label: 'CPF', value: 'cpf' },
      ],
      { placeHolder: 'Qual?', matchOnDescription: true },
    );
    mockWindow.showQuickPick.mockResolvedValueOnce(undefined);
    expect(await new VsCodeQuickPick().pick([{ label: 'CPF', value: 'cpf' }], 'Qual?')).toBeUndefined();
  });
});

describe('VsCodeInputPrompt', () => {
  it('shows an input box with live feedback mapped to severities', async () => {
    mockWindow.showInputBox.mockResolvedValueOnce('texto');
    const answer = await new VsCodeInputPrompt().ask({
      title: 'Título',
      placeholder: 'Cole aqui',
      value: 'inicial',
      feedback: (text) => (text === '' ? undefined : { valid: text === 'ok', message: text }),
    });
    expect(answer).toBe('texto');
    const [options] = mockWindow.showInputBox.mock.calls[0] ?? [];
    expect(options).toMatchObject({ title: 'Título', placeHolder: 'Cole aqui', value: 'inicial', ignoreFocusOut: true });
    expect(options?.validateInput('')).toBeUndefined();
    expect(options?.validateInput('ok')).toEqual({ message: '✅ ok', severity: vscode.InputBoxValidationSeverity.Info });
    expect(options?.validateInput('ruim')).toEqual({ message: '❌ ruim', severity: vscode.InputBoxValidationSeverity.Warning });
  });
});

describe('KitHoverProvider', () => {
  const documents = new DocumentRegistry([new Cpf(), new Cnpj()]);
  const provider = (hoverEnabled = true) =>
    new KitHoverProvider(new TokenScanner(), new TextInspector(documents, decodeBrCode, decodeTestBoleto), new InspectionRenderer(), fakeSettings({ hoverEnabled }));

  it('explains the PIX or document under the cursor', () => {
    const line = `x = "${BCB_PIX}"`;
    const hover = provider().provideHover(hoverDocument(line), position(10)) as unknown as { contents: { value: string }; range: unknown };
    expect(hover.contents.value).toContain('PIX copia-e-cola');
    expect(hover.range).toEqual(new vscode.Range(3, 5, 3, 5 + BCB_PIX.length));
    const cpfHover = provider().provideHover(hoverDocument(VALID_CPF), position(1)) as unknown as { contents: { value: string } };
    expect(cpfHover.contents.value).toContain('é válido');
  });

  it('stays quiet when disabled, off target or for invalid bare numbers', () => {
    expect(provider(false).provideHover(hoverDocument(VALID_CPF), position(1))).toBeUndefined();
    expect(provider().provideHover(hoverDocument('nada'), position(1))).toBeUndefined();
    expect(provider().provideHover(hoverDocument('52998224726'), position(1))).toBeUndefined();
    const unknownInspector = new TextInspector(new DocumentRegistry([]), decodeBrCode, decodeTestBoleto);
    const blind = new KitHoverProvider(new TokenScanner(), unknownInspector, new InspectionRenderer(), fakeSettings());
    expect(blind.provideHover(hoverDocument(VALID_CPF_DIGITS), position(1))).toBeUndefined();
  });
});

describe('registerCommands', () => {
  it('registers every command by id', async () => {
    const execute = vi.fn((_argument?: unknown) => Promise.resolve());
    const disposables = registerCommands([{ id: 'kit.a', execute }]);
    expect(disposables).toHaveLength(1);
    await commandHandlers.get('kit.a')?.('cpf');
    expect(execute).toHaveBeenCalledWith('cpf');
  });
});

describe('extension', () => {
  it('registers all commands and the hover provider', async () => {
    const context = { subscriptions: [] as unknown[], extensionUri: new Uri('/ext') };
    activate(context as unknown as vscode.ExtensionContext);
    expect([...commandHandlers.keys()].sort()).toEqual(Object.values(COMMAND_IDS).sort());
    expect(vscode.languages.registerHoverProvider).toHaveBeenCalledWith([{ scheme: 'file' }, { scheme: 'untitled' }], expect.any(KitHoverProvider));
    expect(vscode.window.registerWebviewViewProvider).toHaveBeenCalledWith('kitDevBrasil.tools', expect.any(SidebarViewProvider));
    expect(context.subscriptions).toHaveLength(Object.keys(COMMAND_IDS).length + 3);
    const raw = textEditor([''], [{ text: '', active: { line: 0, character: 0 } }]);
    (vscode.window as { activeTextEditor: unknown }).activeTextEditor = raw;
    for (const id of [COMMAND_IDS.generateCpf, COMMAND_IDS.generateCnpj, COMMAND_IDS.generateAlphanumericCnpj]) {
      await commandHandlers.get(id)?.();
    }
    expect(raw.replaced.map(([, text]) => text)).toEqual([expect.stringMatching(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/), expect.stringMatching(/\/0001-/), expect.stringMatching(/\/0001-/)]);
    const withDocument = textEditor([''], [{ text: VALID_CPF_DIGITS, active: { line: 0, character: 0 } }]);
    (vscode.window as { activeTextEditor: unknown }).activeTextEditor = withDocument;
    await commandHandlers.get(COMMAND_IDS.formatSelection)?.();
    await commandHandlers.get(COMMAND_IDS.validateSelection)?.();
    const withMask = textEditor([''], [{ text: VALID_CPF, active: { line: 0, character: 0 } }]);
    (vscode.window as { activeTextEditor: unknown }).activeTextEditor = withMask;
    await commandHandlers.get(COMMAND_IDS.unformatSelection)?.();
    await commandHandlers.get(COMMAND_IDS.inspectPix)?.();
    expect(withDocument.replaced.map(([, text]) => text)).toEqual([VALID_CPF]);
    expect(withMask.replaced.map(([, text]) => text)).toEqual([VALID_CPF_DIGITS]);
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(`CPF ${VALID_CPF} é válido`);
    expect(vscode.workspace.openTextDocument).toHaveBeenCalled();
    const withBoleto = textEditor([''], [{ text: OFFICIAL_BANK_LINE, active: { line: 0, character: 0 } }]);
    (vscode.window as { activeTextEditor: unknown }).activeTextEditor = withBoleto;
    await commandHandlers.get(COMMAND_IDS.convertBoleto)?.();
    expect(withBoleto.replaced.map(([, text]) => text)).toEqual([OFFICIAL_BANK_BARCODE]);
    const [, sidebarProvider] = vi.mocked(vscode.window.registerWebviewViewProvider).mock.calls.at(-1) ?? [];
    const posted: unknown[] = [];
    let receive: (message: unknown) => Promise<void> = () => Promise.resolve();
    (sidebarProvider as vscode.WebviewViewProvider).resolveWebviewView(
      {
        webview: {
          options: {},
          html: '',
          cspSource: 's',
          asWebviewUri: (uri: unknown) => uri,
          postMessage: (message: unknown) => (posted.push(message), Promise.resolve(true)),
          onDidReceiveMessage: (listener: (message: unknown) => Promise<void>) => ((receive = listener), { dispose: () => undefined }),
        },
        onDidDispose: () => ({ dispose: () => undefined }),
      } as unknown as vscode.WebviewView,
      {} as vscode.WebviewViewResolveContext,
      {} as vscode.CancellationToken,
    );
    await receive({ type: 'inspect-boleto', text: OFFICIAL_BANK_LINE });
    await receive({ type: 'generate-pix', form: { key: 'a@b.co', merchantName: 'A', merchantCity: 'B', amount: '', txid: '' } });
    expect(posted).toEqual([
      expect.objectContaining({ type: 'boleto-result', view: expect.objectContaining({ state: 'valid' }) }),
      expect.objectContaining({ type: 'pix-generated', view: expect.objectContaining({ qrDataUrl: expect.stringMatching(/^data:image\/svg/) }) }),
    ]);
    const [, hoverProvider] = vi.mocked(vscode.languages.registerHoverProvider).mock.calls.at(-1) ?? [];
    const hover = (hoverProvider as KitHoverProvider).provideHover(hoverDocument(OFFICIAL_BANK_LINE), position(3)) as unknown as { contents: { value: string } };
    expect(hover.contents.value).toContain('**Boleto**');
    await commandHandlers.get(COMMAND_IDS.generateDocument)?.();
    expect(withBoleto.replaced.at(-1)?.[1]).toMatch(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/);
    await commandHandlers.get(COMMAND_IDS.generatePerson)?.();
    await commandHandlers.get(COMMAND_IDS.generateCompany)?.();
    expect(withBoleto.replaced.slice(-2).map(([, text]) => Object.keys(JSON.parse(text))[0])).toEqual(['nome', 'razaoSocial']);
    expect(deactivate()).toBeUndefined();
  });
});

import { describe, expect, it, vi } from 'vitest';
import { decodeTestBoleto } from '../../fakes/boleto';
import type * as vscode from 'vscode';
import { DocumentGenerator } from '../../../src/application/generation/DocumentGenerator';
import { GeneratedValues } from '../../../src/application/generation/GeneratedValues';
import type { GeneratorId } from '../../../src/application/generation/generatorIds';
import { TextInspector } from '../../../src/application/inspection/TextInspector';
import { Cnpj } from '../../../src/domain/documents/Cnpj';
import { Cpf } from '../../../src/domain/documents/Cpf';
import { DocumentRegistry } from '../../../src/domain/documents/DocumentRegistry';
import { decodeBrCode } from '../../../src/domain/pix/decodeBrCode';
import { InspectionRenderer } from '../../../src/presentation/InspectionRenderer';
import type { HostToSidebarMessage } from '../../../src/shared/sidebarProtocol';
import { COMMAND_MESSAGES } from '../../../src/vscode/commands/messages';
import type { PixReport } from '../../../src/vscode/commands/PixReport';
import { renderSidebarHtml } from '../../../src/vscode/sidebar/sidebarHtml';
import { SidebarViewProvider } from '../../../src/vscode/sidebar/SidebarViewProvider';
import { FakeNotifier, fakeSettings } from '../../fakes/FakeEditor';
import { sequenceRandom } from '../../fakes/random';
import { BCB_PIX, OFFICIAL_BANK_BARCODE, OFFICIAL_BANK_LINE, VALID_CNPJ_DIGITS, VALID_CPF, VALID_CPF_DIGITS } from '../../fakes/samples';
import { catalogGenerators, emptyGenerated } from '../../fakes/generators';
import { Uri } from '../../mocks/vscode';

const setup = () => {
  const cpf = new Cpf();
  const cnpj = new Cnpj();
  const queue = [VALID_CPF_DIGITS, '12345678909'];
  const generator = new DocumentGenerator<GeneratorId>(
    catalogGenerators({
      cpf: { label: 'CPF', type: cpf, generate: () => queue.shift() ?? VALID_CPF_DIGITS },
      cnpj: { label: 'CNPJ', type: cnpj, generate: () => VALID_CNPJ_DIGITS },
    }),
    sequenceRandom([0]),
  );
  const values = new GeneratedValues(generator);
  const settings = fakeSettings();
  const clipboard = { writeText: vi.fn((_text: string) => Promise.resolve()) };
  const notifier = new FakeNotifier();
  const report = { present: vi.fn((_text: string) => Promise.resolve()) };
  const formatSelection = { id: 'f', execute: vi.fn(() => Promise.resolve()) };
  const unformatSelection = { id: 'u', execute: vi.fn(() => Promise.resolve()) };
  const provider = new SidebarViewProvider(
    new Uri('/ext') as unknown as vscode.Uri,
    {
      values,
      settings,
      inspector: new TextInspector(new DocumentRegistry([cpf, cnpj]), decodeBrCode, decodeTestBoleto),
      renderer: new InspectionRenderer(),
      decode: decodeBrCode,
      decodeBoleto: decodeTestBoleto,
      qrCode: (text: string) => `data:qr,${text.length}`,
      report: report as unknown as PixReport,
      clipboard,
      notifier,
      formatSelection,
      unformatSelection,
    },
    () => 'NONCE',
  );
  const posted: HostToSidebarMessage[] = [];
  let receive: (message: unknown) => Promise<void> = () => Promise.resolve();
  let disposeView = () => undefined as void;
  const webview = {
    options: {},
    html: '',
    cspSource: 'vscode-resource:',
    asWebviewUri: (uri: Uri) => uri,
    postMessage: (message: HostToSidebarMessage) => (posted.push(message), Promise.resolve(true)),
    onDidReceiveMessage: (listener: (message: unknown) => Promise<void>) => {
      receive = listener;
      return { dispose: () => undefined };
    },
  };
  const view = {
    webview,
    onDidDispose: (listener: () => void) => {
      disposeView = listener;
      return { dispose: () => undefined };
    },
  };
  provider.resolveWebviewView(view as unknown as vscode.WebviewView);
  return { provider, webview, posted, send: (message: unknown) => receive(message), disposeView: () => disposeView(), values, settings, clipboard, notifier, report, formatSelection, unformatSelection };
};

describe('renderSidebarHtml', () => {
  it('locks scripts to the nonce and styles to the webview source', () => {
    const html = renderSidebarHtml({ cspSource: 'vscode-resource:', scriptUri: 'app.js', styleUri: 'app.css', nonce: 'N1' });
    expect(html).toContain("default-src 'none'; img-src data:; style-src vscode-resource:; script-src 'nonce-N1';");
    expect(html).toContain('<script nonce="N1" src="app.js"></script>');
    expect(html).toContain('<link rel="stylesheet" href="app.css">');
    expect(html).toContain('id="document-input"');
    expect(html).toContain('id="pix-input"');
  });
});

describe('SidebarViewProvider', () => {
  it('serves the bundled page with scripts enabled only for dist', () => {
    const { webview } = setup();
    expect(webview.options).toEqual({ enableScripts: true, localResourceRoots: [new Uri('/ext/dist')] });
    expect(webview.html).toContain('webview:/ext/dist/sidebar.js');
    expect(webview.html).toContain('webview:/ext/dist/sidebar.css');
    expect(webview.html).toContain("'nonce-NONCE'");
  });

  it('sends the state when ready and whenever a value is generated', async () => {
    const { send, posted, clipboard, notifier } = setup();
    await send({ type: 'ready' });
    expect(posted.at(-1)).toEqual({ type: 'state', state: { generated: emptyGenerated(), formatted: true } });
    await send({ type: 'generate', id: 'cpf' });
    expect(posted.at(-1)).toMatchObject({ type: 'state', state: { generated: { cpf: VALID_CPF } } });
    expect(clipboard.writeText).toHaveBeenLastCalledWith(VALID_CPF);
    expect(notifier.statuses).toEqual([COMMAND_MESSAGES.copied('CPF', VALID_CPF)]);
  });

  it('copies the current value and regenerates on request', async () => {
    const { send, clipboard, values } = setup();
    await send({ type: 'copy-generated', id: 'cnpj' });
    expect(clipboard.writeText).toHaveBeenLastCalledWith('11.222.333/0001-81');
    await send({ type: 'generate', id: 'cpf' });
    await send({ type: 'copy-generated', id: 'cpf' });
    expect(clipboard.writeText).toHaveBeenLastCalledWith(VALID_CPF);
    await send({ type: 'generate', id: 'cpf' });
    expect(values.current('cpf')).toBe('123.456.789-09');
  });

  it('ignores unknown messages and generators', async () => {
    const { send, posted, clipboard } = setup();
    await send({ type: 'hack' });
    await send(null);
    await send('ready');
    await send({ type: 'generate', id: 'pix' });
    expect(posted).toEqual([]);
    expect(clipboard.writeText).not.toHaveBeenCalled();
  });

  it('stores the mask preference and echoes the state', async () => {
    const { send, settings, posted } = setup();
    await send({ type: 'set-formatted', value: false });
    expect(settings.setGenerateFormatted).toHaveBeenCalledWith(false);
    expect(posted.at(-1)).toMatchObject({ state: { formatted: false } });
    await send({ type: 'set-formatted', value: 'yes' });
    expect(settings.setGenerateFormatted).toHaveBeenLastCalledWith(false);
  });

  it('validates documents live and copies the formatted value', async () => {
    const { send, posted, clipboard, notifier } = setup();
    await send({ type: 'validate', text: ` ${VALID_CPF_DIGITS} ` });
    expect(posted.at(-1)).toEqual({ type: 'document-result', view: { state: 'valid', message: `CPF ${VALID_CPF} é válido`, formatted: VALID_CPF } });
    await send({ type: 'validate', text: '  ' });
    expect(posted.at(-1)).toEqual({ type: 'document-result', view: { state: 'empty', message: '', formatted: undefined } });
    await send({ type: 'validate', text: 'abc' });
    expect(posted.at(-1)).toMatchObject({ view: { state: 'unknown' } });
    await send({ type: 'copy-formatted', text: VALID_CPF_DIGITS });
    expect(clipboard.writeText).toHaveBeenCalledWith(VALID_CPF);
    expect(notifier.statuses).toEqual([COMMAND_MESSAGES.formattedCopied(VALID_CPF)]);
    await send({ type: 'copy-formatted', text: 'abc' });
    expect(clipboard.writeText).toHaveBeenCalledOnce();
  });

  it('inspects PIX codes live, opens the report and copies JSON', async () => {
    const { send, posted, report, clipboard, notifier } = setup();
    await send({ type: 'inspect-pix', text: BCB_PIX });
    expect(posted.at(-1)).toMatchObject({ type: 'pix-result', view: { state: 'valid', summary: 'PIX válido: valor livre para Fulano de Tal', issues: [] } });
    await send({ type: 'inspect-pix', text: '' });
    expect(posted.at(-1)).toEqual({ type: 'pix-result', view: { state: 'empty', summary: '', fields: [], issues: [] } });
    await send({ type: 'open-pix-report', text: ` ${BCB_PIX} ` });
    expect(report.present).toHaveBeenCalledWith(BCB_PIX);
    await send({ type: 'copy-pix-json', text: BCB_PIX });
    expect(JSON.parse(String(clipboard.writeText.mock.calls[0]?.[0]))).toMatchObject({ brCode: { crc: '1D3D' } });
    expect(notifier.statuses).toEqual([COMMAND_MESSAGES.jsonCopied]);
  });

  it('inspects boletos live and copies either representation', async () => {
    const { send, posted, clipboard, notifier } = setup();
    await send({ type: 'inspect-boleto', text: OFFICIAL_BANK_LINE });
    expect(posted.at(-1)).toMatchObject({ type: 'boleto-result', view: { state: 'valid', issues: [] } });
    await send({ type: 'inspect-boleto', text: ' ' });
    expect(posted.at(-1)).toEqual({ type: 'boleto-result', view: { state: 'empty', summary: '', fields: [], issues: [] } });
    await send({ type: 'copy-boleto', text: OFFICIAL_BANK_LINE, format: 'barcode' });
    await send({ type: 'copy-boleto', text: OFFICIAL_BANK_BARCODE, format: 'line' });
    await send({ type: 'copy-boleto', text: '123', format: 'line' });
    expect(clipboard.writeText.mock.calls.map(([text]) => text)).toEqual([OFFICIAL_BANK_BARCODE, '00191234546789012345767890123457196360000123400']);
    expect(notifier.statuses).toEqual([COMMAND_MESSAGES.boletoCopied('barcode'), COMMAND_MESSAGES.boletoCopied('line')]);
  });

  it('generates test PIX codes with a QR code and reports form issues', async () => {
    const { send, posted } = setup();
    await send({ type: 'generate-pix', form: { key: 'a@b.co', merchantName: 'FULANO', merchantCity: 'RECIFE', amount: '', txid: '' } });
    expect(posted.at(-1)).toMatchObject({ type: 'pix-generated', view: { code: expect.stringMatching(/^000201/), qrDataUrl: expect.stringMatching(/^data:qr,/), issues: [] } });
    await send({ type: 'generate-pix', form: { key: 7 } });
    expect(posted.at(-1)).toMatchObject({ view: { code: undefined, qrDataUrl: undefined, issues: ['Chave: obrigatório', 'Nome do recebedor: obrigatório', 'Cidade: obrigatório'] } });
    await send({ type: 'generate-pix', form: null });
    expect(posted.at(-1)).toMatchObject({ view: { code: undefined } });
  });

  it('copies plain text only when it is a reasonable string', async () => {
    const { send, clipboard, notifier } = setup();
    await send({ type: 'copy-text', text: 'abc' });
    await send({ type: 'copy-text', text: '' });
    await send({ type: 'copy-text', text: 'x'.repeat(2001) });
    await send({ type: 'copy-text', text: 5 });
    expect(clipboard.writeText.mock.calls).toEqual([['abc']]);
    expect(notifier.statuses).toEqual([COMMAND_MESSAGES.textCopied]);
  });

  it('runs the selection commands', async () => {
    const { send, formatSelection, unformatSelection } = setup();
    await send({ type: 'format-selection' });
    await send({ type: 'unformat-selection' });
    expect(formatSelection.execute).toHaveBeenCalledOnce();
    expect(unformatSelection.execute).toHaveBeenCalledOnce();
  });

  it('stops posting after the view or the provider is disposed', async () => {
    const { provider, send, posted, disposeView, values } = setup();
    disposeView();
    await send({ type: 'ready' });
    expect(posted).toEqual([]);
    provider.dispose();
    values.next('cpf', true);
    expect(posted).toEqual([]);
  });

  it('creates a random nonce by default', () => {
    const provider = new SidebarViewProvider(new Uri('/ext') as unknown as vscode.Uri, setupServices());
    const webview = { options: {}, html: '', cspSource: 's', asWebviewUri: (uri: Uri) => uri, onDidReceiveMessage: () => ({ dispose: () => undefined }) };
    provider.resolveWebviewView({ webview, onDidDispose: () => ({ dispose: () => undefined }) } as unknown as vscode.WebviewView);
    expect(webview.html).toMatch(/'nonce-[A-Za-z0-9+/=]{24}'/);
  });
});

function setupServices() {
  const cpf = new Cpf();
  const generator = new DocumentGenerator<GeneratorId>(catalogGenerators(), sequenceRandom([0]));
  return {
    values: new GeneratedValues(generator),
    settings: fakeSettings(),
    inspector: new TextInspector(new DocumentRegistry([cpf]), decodeBrCode, decodeTestBoleto),
    renderer: new InspectionRenderer(),
    decode: decodeBrCode,
    decodeBoleto: decodeTestBoleto,
    qrCode: () => '',
    report: {} as PixReport,
    clipboard: { writeText: () => Promise.resolve() },
    notifier: new FakeNotifier(),
    formatSelection: { id: 'f', execute: () => Promise.resolve() },
    unformatSelection: { id: 'u', execute: () => Promise.resolve() },
  };
}

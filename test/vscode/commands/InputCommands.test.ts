import { describe, expect, it, vi } from 'vitest';
import { TextInspector } from '../../../src/application/inspection/TextInspector';
import { TokenScanner } from '../../../src/application/scanning/TokenScanner';
import { Cnpj } from '../../../src/domain/documents/Cnpj';
import { Cpf } from '../../../src/domain/documents/Cpf';
import { DocumentRegistry } from '../../../src/domain/documents/DocumentRegistry';
import { decodeBrCode } from '../../../src/domain/pix/decodeBrCode';
import { InspectionRenderer } from '../../../src/presentation/InspectionRenderer';
import { firstSelection, pixAtCursor } from '../../../src/vscode/commands/editorText';
import { InspectPixInputCommand, ValidateInputCommand } from '../../../src/vscode/commands/InputCommands';
import { COMMAND_MESSAGES } from '../../../src/vscode/commands/messages';
import { PixReport } from '../../../src/vscode/commands/PixReport';
import type { InputRequest } from '../../../src/vscode/types';
import { editorProvider, FakeEditor, FakeNotifier } from '../../fakes/FakeEditor';
import { BCB_PIX, VALID_CPF, VALID_CPF_DIGITS } from '../../fakes/samples';

const inspector = new TextInspector(new DocumentRegistry([new Cpf(), new Cnpj()]), decodeBrCode);
const renderer = new InspectionRenderer();

const promptAnswering = (answer: string | undefined) => {
  const requests: InputRequest[] = [];
  return { requests, ask: vi.fn((request: InputRequest) => (requests.push(request), Promise.resolve(answer))) };
};

const clipboardFake = () => ({ writeText: vi.fn((_text: string) => Promise.resolve()) });

describe('editorText', () => {
  it('finds the first non-empty selection and the PIX under the cursor', () => {
    expect(firstSelection(new FakeEditor(['', '  x  ']))).toBe('x');
    expect(firstSelection(new FakeEditor(['']))).toBeUndefined();
    expect(firstSelection(undefined)).toBeUndefined();
    const scanner = new TokenScanner();
    expect(pixAtCursor(new FakeEditor([''], { text: BCB_PIX, column: 3 }), scanner)).toBe(BCB_PIX);
    expect(pixAtCursor(new FakeEditor([''], { text: VALID_CPF, column: 3 }), scanner)).toBeUndefined();
    expect(pixAtCursor(new FakeEditor([''], { text: 'nada', column: 1 }), scanner)).toBeUndefined();
    expect(pixAtCursor(undefined, scanner)).toBeUndefined();
  });
});

describe('ValidateInputCommand', () => {
  const setup = (answer: string | undefined, choice?: string, editor = new FakeEditor([''])) => {
    const prompt = promptAnswering(answer);
    const notifier = new FakeNotifier(choice);
    const clipboard = clipboardFake();
    const command = new ValidateInputCommand('kit.validateInput', { inspector, renderer, prompt, editors: editorProvider(editor), clipboard, notifier });
    return { command, prompt, notifier, clipboard };
  };

  it('prefills with the selection and gives live feedback', async () => {
    const { command, prompt } = setup(undefined, undefined, new FakeEditor([` ${VALID_CPF} `]));
    await command.execute();
    const [request] = prompt.requests;
    expect(request?.value).toBe(VALID_CPF);
    expect(request?.title).toBe(COMMAND_MESSAGES.validateTitle);
    expect(request?.feedback('  ')).toBeUndefined();
    expect(request?.feedback('abc')).toEqual({ valid: false, message: COMMAND_MESSAGES.notADocumentShort });
    expect(request?.feedback(VALID_CPF_DIGITS)).toEqual({ valid: true, message: `CPF ${VALID_CPF} é válido` });
    expect(request?.feedback('529.982.247-26')).toMatchObject({ valid: false });
  });

  it('starts empty without an editor and does nothing when cancelled or empty', async () => {
    const prompt = promptAnswering('  ');
    const notifier = new FakeNotifier();
    await new ValidateInputCommand('kit.validateInput', { inspector, renderer, prompt, editors: editorProvider(undefined), clipboard: clipboardFake(), notifier }).execute();
    expect(prompt.requests[0]?.value).toBe('');
    const cancelled = setup(undefined);
    await cancelled.command.execute();
    expect([...notifier.infos, ...notifier.warnings, ...cancelled.notifier.infos]).toEqual([]);
  });

  it('warns about text that is not a document', async () => {
    const { command, notifier } = setup(' abc ');
    await command.execute();
    expect(notifier.warnings).toEqual([COMMAND_MESSAGES.notADocument('abc')]);
  });

  it('shows the result and copies the formatted value on request', async () => {
    const accepted = setup(VALID_CPF_DIGITS, COMMAND_MESSAGES.copyFormatted);
    await accepted.command.execute();
    expect(accepted.notifier.infos).toEqual([`CPF ${VALID_CPF} é válido`]);
    expect(accepted.clipboard.writeText).toHaveBeenCalledWith(VALID_CPF);
    expect(accepted.notifier.statuses).toEqual([COMMAND_MESSAGES.formattedCopied(VALID_CPF)]);
    const dismissed = setup(VALID_CPF_DIGITS);
    await dismissed.command.execute();
    expect(dismissed.clipboard.writeText).not.toHaveBeenCalled();
  });
});

describe('PixReport', () => {
  const setup = (choice?: string) => {
    const notifier = new FakeNotifier(choice);
    const presenter = { show: vi.fn((_content: string) => Promise.resolve()) };
    const clipboard = clipboardFake();
    return { notifier, presenter, clipboard, report: new PixReport({ decode: decodeBrCode, renderer, presenter, clipboard, notifier }) };
  };

  it('summarizes and validates codes', () => {
    const { report } = setup();
    expect(report.summarize(BCB_PIX)).toBe('PIX válido: valor livre para Fulano de Tal');
    expect(report.isValid(BCB_PIX)).toBe(true);
    expect(report.isValid('000201')).toBe(false);
  });

  it('presents the report and copies JSON on request', async () => {
    const copied = setup(COMMAND_MESSAGES.copyJson);
    await copied.report.present(BCB_PIX);
    expect(copied.presenter.show).toHaveBeenCalledWith(expect.stringContaining('✅ válido'));
    expect(JSON.parse(String(copied.clipboard.writeText.mock.calls[0]?.[0]))).toMatchObject({ brCode: { crc: '1D3D' } });
    expect(copied.notifier.infos).toEqual([COMMAND_MESSAGES.pixInspected, COMMAND_MESSAGES.jsonCopied]);
    const plain = setup();
    await plain.report.present(BCB_PIX);
    expect(plain.clipboard.writeText).not.toHaveBeenCalled();
  });
});

describe('InspectPixInputCommand', () => {
  const setup = (answer: string | undefined, editor: FakeEditor | undefined) => {
    const prompt = promptAnswering(answer);
    const report = { present: vi.fn((_text: string) => Promise.resolve()), isValid: (text: string) => text === BCB_PIX, summarize: () => 'resumo' };
    const command = new InspectPixInputCommand('kit.pixInput', { scanner: new TokenScanner(), report: report as unknown as PixReport, prompt, editors: editorProvider(editor) });
    return { command, prompt, report };
  };

  it('prefills from the selection or the cursor and gives live feedback', async () => {
    const fromSelection = setup(undefined, new FakeEditor([BCB_PIX]));
    await fromSelection.command.execute();
    const [request] = fromSelection.prompt.requests;
    expect(request?.value).toBe(BCB_PIX);
    expect(request?.feedback(' ')).toBeUndefined();
    expect(request?.feedback(BCB_PIX)).toEqual({ valid: true, message: 'resumo' });
    expect(request?.feedback('x')).toEqual({ valid: false, message: 'resumo' });
    const fromCursor = setup(undefined, new FakeEditor([''], { text: BCB_PIX, column: 5 }));
    await fromCursor.command.execute();
    expect(fromCursor.prompt.requests[0]?.value).toBe(BCB_PIX);
    const empty = setup(undefined, undefined);
    await empty.command.execute();
    expect(empty.prompt.requests[0]?.value).toBe('');
  });

  it('presents the pasted code and ignores cancelled or empty input', async () => {
    const pasted = setup(` ${BCB_PIX} `, undefined);
    await pasted.command.execute();
    expect(pasted.report.present).toHaveBeenCalledWith(BCB_PIX);
    const blank = setup('  ', undefined);
    await blank.command.execute();
    const cancelled = setup(undefined, undefined);
    await cancelled.command.execute();
    expect(blank.report.present).not.toHaveBeenCalled();
    expect(cancelled.report.present).not.toHaveBeenCalled();
  });
});

import { describe, expect, it, vi } from 'vitest';
import { DocumentGenerator } from '../../../src/application/generation/DocumentGenerator';
import { TextInspector } from '../../../src/application/inspection/TextInspector';
import { TokenScanner } from '../../../src/application/scanning/TokenScanner';
import { TextTransformer } from '../../../src/application/transform/TextTransformer';
import { Cnpj } from '../../../src/domain/documents/Cnpj';
import { Cpf } from '../../../src/domain/documents/Cpf';
import { DocumentRegistry } from '../../../src/domain/documents/DocumentRegistry';
import { decodeBrCode } from '../../../src/domain/pix/decodeBrCode';
import { InspectionRenderer } from '../../../src/presentation/InspectionRenderer';
import { GenerateDocumentCommand } from '../../../src/vscode/commands/GenerateDocumentCommand';
import { InspectPixCommand } from '../../../src/vscode/commands/InspectPixCommand';
import { COMMAND_MESSAGES } from '../../../src/vscode/commands/messages';
import { TransformSelectionCommand } from '../../../src/vscode/commands/TransformSelectionCommand';
import { ValidateSelectionCommand } from '../../../src/vscode/commands/ValidateSelectionCommand';
import { editorProvider, FakeEditor, FakeNotifier } from '../../fakes/FakeEditor';
import { sequenceRandom } from '../../fakes/random';
import { BCB_PIX, VALID_CNPJ, VALID_CPF, VALID_CPF_DIGITS } from '../../fakes/samples';

const cpf = new Cpf();
const documents = new DocumentRegistry([cpf, new Cnpj()]);
const inspector = new TextInspector(documents, decodeBrCode);
const renderer = new InspectionRenderer();
const transformer = new TextTransformer(documents);

describe('EditorCommand', () => {
  it('warns when no editor is open', async () => {
    const notifier = new FakeNotifier();
    await new TransformSelectionCommand('id', () => 'x', 'nothing', editorProvider(undefined), notifier).execute();
    expect(notifier.warnings).toEqual([COMMAND_MESSAGES.noEditor]);
  });
});

describe('GenerateDocumentCommand', () => {
  it('inserts a fresh value at every cursor, following the mask setting', async () => {
    const generator = new DocumentGenerator({ cpf: { type: cpf, generate: () => VALID_CPF_DIGITS } }, sequenceRandom([0]));
    const editor = new FakeEditor(['', 'old']);
    const settings = { generateFormatted: true, hoverEnabled: true };
    const command = new GenerateDocumentCommand('kit.cpf', 'cpf', generator, settings, editorProvider(editor), new FakeNotifier());
    await command.execute();
    expect(command.id).toBe('kit.cpf');
    expect(editor.replacements).toEqual([[VALID_CPF, VALID_CPF]]);
    await new GenerateDocumentCommand('kit.cpf', 'cpf', generator, { ...settings, generateFormatted: false }, editorProvider(editor), new FakeNotifier()).execute();
    expect(editor.replacements[1]).toEqual([VALID_CPF_DIGITS, VALID_CPF_DIGITS]);
  });
});

describe('TransformSelectionCommand', () => {
  const format = (editor: FakeEditor, notifier = new FakeNotifier()) =>
    new TransformSelectionCommand('kit.format', (text) => transformer.format(text), COMMAND_MESSAGES.nothingToFormat, editorProvider(editor), notifier);

  it('needs a selection', async () => {
    const notifier = new FakeNotifier();
    await format(new FakeEditor(['', '  ']), notifier).execute();
    expect(notifier.warnings).toEqual([COMMAND_MESSAGES.noSelection]);
  });

  it('warns when nothing can be transformed', async () => {
    const notifier = new FakeNotifier();
    const editor = new FakeEditor(['hello']);
    await format(editor, notifier).execute();
    expect(notifier.warnings).toEqual([COMMAND_MESSAGES.nothingToFormat]);
    expect(editor.replacements).toEqual([]);
  });

  it('replaces only the selections it understands', async () => {
    const editor = new FakeEditor([` ${VALID_CPF_DIGITS} `, 'hello']);
    await format(editor).execute();
    expect(editor.replacements).toEqual([[VALID_CPF, undefined]]);
  });
});

describe('ValidateSelectionCommand', () => {
  it('summarizes every selection', async () => {
    const notifier = new FakeNotifier();
    await new ValidateSelectionCommand('kit.validate', inspector, renderer, editorProvider(new FakeEditor([VALID_CPF, '', 'abc', VALID_CNPJ])), notifier).execute();
    expect(notifier.infos).toEqual([`CPF ${VALID_CPF} é válido · "abc" não parece um CPF ou CNPJ. · CNPJ ${VALID_CNPJ} é válido`]);
  });

  it('needs a selection', async () => {
    const notifier = new FakeNotifier();
    await new ValidateSelectionCommand('kit.validate', inspector, renderer, editorProvider(new FakeEditor([''])), notifier).execute();
    expect(notifier.warnings).toEqual([COMMAND_MESSAGES.noSelection]);
  });
});

describe('InspectPixCommand', () => {
  const setup = (editor: FakeEditor, choice?: string) => {
    const notifier = new FakeNotifier(choice);
    const presenter = { show: vi.fn(() => Promise.resolve()) };
    const clipboard = { writeText: vi.fn((_text: string) => Promise.resolve()) };
    const command = new InspectPixCommand('kit.pix', { scanner: new TokenScanner(), decode: decodeBrCode, renderer, presenter, clipboard }, editorProvider(editor), notifier);
    return { command, notifier, presenter, clipboard };
  };

  it('shows the selected PIX and copies it as JSON on request', async () => {
    const { command, notifier, presenter, clipboard } = setup(new FakeEditor([` ${BCB_PIX} `]), COMMAND_MESSAGES.copyJson);
    await command.execute();
    expect(presenter.show).toHaveBeenCalledWith(expect.stringContaining('✅ válido'));
    expect(JSON.parse(String(clipboard.writeText.mock.calls[0]?.[0]))).toMatchObject({ brCode: { crc: '1D3D' }, issues: [] });
    expect(notifier.infos).toEqual([COMMAND_MESSAGES.pixInspected, COMMAND_MESSAGES.jsonCopied]);
  });

  it('finds the PIX under the cursor when nothing is selected', async () => {
    const { command, presenter, clipboard } = setup(new FakeEditor([''], { text: `pix = "${BCB_PIX}"`, column: 20 }));
    await command.execute();
    expect(presenter.show).toHaveBeenCalledOnce();
    expect(clipboard.writeText).not.toHaveBeenCalled();
  });

  it('warns when there is no PIX to inspect', async () => {
    const onDocument = setup(new FakeEditor([''], { text: VALID_CPF, column: 2 }));
    await onDocument.command.execute();
    const onNothing = setup(new FakeEditor([''], { text: 'nada', column: 1 }));
    await onNothing.command.execute();
    expect([...onDocument.notifier.warnings, ...onNothing.notifier.warnings]).toEqual([COMMAND_MESSAGES.noPix, COMMAND_MESSAGES.noPix]);
    expect(onDocument.presenter.show).not.toHaveBeenCalled();
  });
});

describe('messages', () => {
  it('quotes the text that is not a document', () => {
    expect(COMMAND_MESSAGES.notADocument('x')).toBe('"x" não parece um CPF ou CNPJ.');
  });
});

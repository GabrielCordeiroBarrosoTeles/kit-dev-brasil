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
import type { PixReport } from '../../../src/vscode/commands/PixReport';
import { COMMAND_MESSAGES } from '../../../src/vscode/commands/messages';
import { TransformSelectionCommand } from '../../../src/vscode/commands/TransformSelectionCommand';
import { ValidateSelectionCommand } from '../../../src/vscode/commands/ValidateSelectionCommand';
import { editorProvider, FakeEditor, FakeNotifier, fakeSettings } from '../../fakes/FakeEditor';
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
    const generator = new DocumentGenerator({ cpf: { label: 'CPF', type: cpf, generate: () => VALID_CPF_DIGITS } }, sequenceRandom([0]));
    const editor = new FakeEditor(['', 'old']);
    const settings = fakeSettings();
    const clipboard = { writeText: vi.fn((_text: string) => Promise.resolve()) };
    const command = new GenerateDocumentCommand('kit.cpf', 'cpf', generator, settings, clipboard, editorProvider(editor), new FakeNotifier());
    await command.execute();
    expect(command.id).toBe('kit.cpf');
    expect(editor.replacements).toEqual([[VALID_CPF, VALID_CPF]]);
    await new GenerateDocumentCommand('kit.cpf', 'cpf', generator, fakeSettings({ generateFormatted: false }), clipboard, editorProvider(editor), new FakeNotifier()).execute();
    expect(editor.replacements[1]).toEqual([VALID_CPF_DIGITS, VALID_CPF_DIGITS]);
    expect(clipboard.writeText).not.toHaveBeenCalled();
  });

  it('copies the generated value when no editor is open', async () => {
    const generator = new DocumentGenerator({ cpf: { label: 'CPF', type: cpf, generate: () => VALID_CPF_DIGITS } }, sequenceRandom([0]));
    const clipboard = { writeText: vi.fn((_text: string) => Promise.resolve()) };
    const notifier = new FakeNotifier();
    await new GenerateDocumentCommand('kit.cpf', 'cpf', generator, fakeSettings(), clipboard, editorProvider(undefined), notifier).execute();
    expect(clipboard.writeText).toHaveBeenCalledWith(VALID_CPF);
    expect(notifier.infos).toEqual([`CPF ${VALID_CPF} copiado para a área de transferência.`]);
    expect(notifier.warnings).toEqual([]);
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
  const setup = (editor: FakeEditor) => {
    const notifier = new FakeNotifier();
    const report = { present: vi.fn((_text: string) => Promise.resolve()) };
    const command = new InspectPixCommand('kit.pix', new TokenScanner(), report as unknown as PixReport, editorProvider(editor), notifier);
    return { command, notifier, report };
  };

  it('reports the selected PIX or the one under the cursor', async () => {
    const selected = setup(new FakeEditor([` ${BCB_PIX} `]));
    await selected.command.execute();
    expect(selected.report.present).toHaveBeenCalledWith(BCB_PIX);
    const atCursor = setup(new FakeEditor([''], { text: `pix = "${BCB_PIX}"`, column: 20 }));
    await atCursor.command.execute();
    expect(atCursor.report.present).toHaveBeenCalledWith(BCB_PIX);
  });

  it('warns when there is no PIX to inspect', async () => {
    const onDocument = setup(new FakeEditor([''], { text: VALID_CPF, column: 2 }));
    await onDocument.command.execute();
    expect(onDocument.notifier.warnings).toEqual([COMMAND_MESSAGES.noPix]);
    expect(onDocument.report.present).not.toHaveBeenCalled();
  });
});

describe('messages', () => {
  it('quotes the text that is not a document', () => {
    expect(COMMAND_MESSAGES.notADocument('x')).toBe('"x" não parece um CPF ou CNPJ.');
  });
});

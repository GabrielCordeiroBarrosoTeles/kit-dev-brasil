import { describe, expect, it } from 'vitest';
import { DocumentGenerator } from '../../src/application/generation/DocumentGenerator';
import { TextInspector } from '../../src/application/inspection/TextInspector';
import { TokenScanner } from '../../src/application/scanning/TokenScanner';
import { TextTransformer } from '../../src/application/transform/TextTransformer';
import { Cnpj } from '../../src/domain/documents/Cnpj';
import { Cpf } from '../../src/domain/documents/Cpf';
import { DocumentRegistry } from '../../src/domain/documents/DocumentRegistry';
import { decodeBrCode } from '../../src/domain/pix/decodeBrCode';
import { CryptoRandomSource } from '../../src/infrastructure/CryptoRandomSource';
import { sequenceRandom } from '../fakes/random';
import { BCB_PIX, VALID_ALPHANUMERIC_CNPJ, VALID_CNPJ, VALID_CNPJ_DIGITS, VALID_CPF, VALID_CPF_DIGITS } from '../fakes/samples';

const cpf = new Cpf();
const cnpj = new Cnpj();
const documents = new DocumentRegistry([cpf, cnpj]);

describe('TokenScanner', () => {
  const scanner = new TokenScanner();

  it('finds a PIX code around the cursor, including spaces inside it', () => {
    const line = `const pix = '${BCB_PIX}';`;
    const start = line.indexOf('000201');
    expect(scanner.findAt(line, start + 120)).toEqual({ kind: 'pix', masked: false, text: BCB_PIX, start, end: start + BCB_PIX.length });
  });

  it('finds masked and unmasked documents', () => {
    expect(scanner.findAt(`cpf: "${VALID_CPF}"`, 8)).toMatchObject({ kind: 'document', masked: true, text: VALID_CPF });
    expect(scanner.findAt(`id=${VALID_ALPHANUMERIC_CNPJ}`, 5)).toMatchObject({ masked: true, text: VALID_ALPHANUMERIC_CNPJ });
    expect(scanner.findAt(`x ${VALID_CNPJ_DIGITS} y`, 4)).toMatchObject({ masked: false, text: VALID_CNPJ_DIGITS });
    expect(scanner.findAt(`x ${VALID_CPF_DIGITS} y`, 2)).toMatchObject({ masked: false, text: VALID_CPF_DIGITS, start: 2, end: 13 });
  });

  it('ignores text away from the cursor or embedded in longer words', () => {
    expect(scanner.findAt(`${VALID_CPF_DIGITS} and more`, 15)).toBeUndefined();
    expect(scanner.findAt(`a${VALID_CPF_DIGITS}`, 3)).toBeUndefined();
    expect(scanner.findAt('nothing here', 3)).toBeUndefined();
    expect(new TokenScanner([]).findAt(VALID_CPF, 1)).toBeUndefined();
  });
});

describe('TextInspector', () => {
  const inspector = new TextInspector(documents, decodeBrCode);

  it('inspects PIX tokens and documents', () => {
    const pix = inspector.inspect({ kind: 'pix', masked: false, text: BCB_PIX, start: 0, end: 1 });
    expect(pix).toMatchObject({ kind: 'pix', decoding: { issues: [] } });
    expect(inspector.inspect({ kind: 'document', masked: false, text: VALID_CPF_DIGITS, start: 0, end: 1 })).toEqual({
      kind: 'document',
      document: 'cpf',
      label: 'CPF',
      formatted: VALID_CPF,
      validation: { valid: true },
    });
    expect(inspector.inspectDocument('hello')).toBeUndefined();
  });

  it('hides invalid unmasked numbers, which are often not documents', () => {
    const token = (masked: boolean) => ({ kind: 'document' as const, masked, text: '', start: 0, end: 0 });
    const invalid = inspector.inspectDocument('529.982.247-26');
    const valid = inspector.inspectDocument(VALID_CPF);
    const pix = inspector.inspect({ kind: 'pix', masked: false, text: 'x', start: 0, end: 0 });
    expect(invalid && inspector.shouldDisplay(token(false), invalid)).toBe(false);
    expect(invalid && inspector.shouldDisplay(token(true), invalid)).toBe(true);
    expect(valid && inspector.shouldDisplay(token(false), valid)).toBe(true);
    expect(pix && inspector.shouldDisplay(token(false), pix)).toBe(true);
  });
});

describe('TextTransformer', () => {
  const transformer = new TextTransformer(documents);

  it('formats recognized documents, valid or not', () => {
    expect(transformer.format(VALID_CPF_DIGITS)).toBe(VALID_CPF);
    expect(transformer.format('52998224726')).toBe('529.982.247-26');
    expect(transformer.format('hello')).toBeUndefined();
  });

  it('removes common mask characters', () => {
    expect(transformer.unformat(VALID_CNPJ)).toBe(VALID_CNPJ_DIGITS);
    expect(transformer.unformat('(11) 99999-8888')).toBe('11999998888');
    expect(transformer.unformat('semmascara')).toBeUndefined();
  });
});

describe('DocumentGenerator', () => {
  it('generates with or without mask', () => {
    const generator = new DocumentGenerator({ cpf: { label: 'CPF', type: cpf, generate: () => VALID_CPF_DIGITS } }, sequenceRandom([0]));
    expect(generator.generate('cpf', true)).toBe(VALID_CPF);
    expect(generator.generate('cpf', false)).toBe(VALID_CPF_DIGITS);
    expect(generator.label('cpf')).toBe('CPF');
  });
});

describe('CryptoRandomSource', () => {
  it('delegates to a secure generator', () => {
    expect(new CryptoRandomSource(() => 7).nextInt(10)).toBe(7);
    const value = new CryptoRandomSource().nextInt(5);
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThan(5);
  });
});

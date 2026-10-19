import { describe, expect, it } from 'vitest';
import { Cnpj } from '../../../src/domain/documents/Cnpj';
import { sequenceRandom } from '../../fakes/random';
import { VALID_ALPHANUMERIC_CNPJ, VALID_CNPJ, VALID_CNPJ_DIGITS } from '../../fakes/samples';

const cnpj = new Cnpj();

describe('Cnpj', () => {
  it('describes itself', () => {
    expect([cnpj.kind, cnpj.label]).toEqual(['cnpj', 'CNPJ']);
  });

  it('accepts numeric and alphanumeric numbers, masked or not, in any case', () => {
    expect(cnpj.validate(VALID_CNPJ)).toEqual({ valid: true });
    expect(cnpj.validate(VALID_CNPJ_DIGITS)).toEqual({ valid: true });
    expect(cnpj.validate(VALID_ALPHANUMERIC_CNPJ)).toEqual({ valid: true });
    expect(cnpj.validate('12abc34501de35')).toEqual({ valid: true });
  });

  it.each([
    ['11.222.333/0001-8!', { code: 'invalid-characters' }],
    ['11.222.333/0001', { code: 'wrong-length', expected: 14, actual: 12 }],
    ['12.ABC.345/01DE-3A', { code: 'invalid-characters' }],
    ['00.000.000/0000-00', { code: 'repeated-characters' }],
    ['11.222.333/0001-82', { code: 'invalid-check-digits', expected: '81', actual: '82' }],
  ])('rejects %s', (text, issue) => {
    expect(cnpj.validate(text)).toEqual({ valid: false, issue });
  });

  it('identifies unmasked digits and masked numeric or alphanumeric shapes', () => {
    expect(cnpj.identifies(VALID_CNPJ_DIGITS)).toBe(true);
    expect(cnpj.identifies(VALID_CNPJ)).toBe(true);
    expect(cnpj.identifies(VALID_ALPHANUMERIC_CNPJ)).toBe(true);
    expect(cnpj.identifies('12ABC34501DE35')).toBe(false);
    expect(cnpj.identifies('12.abc.345/01de-35')).toBe(false);
  });

  it('normalizes and formats', () => {
    expect(cnpj.normalize('12.abc.345/01de-35')).toBe('12ABC34501DE35');
    expect(cnpj.format(VALID_CNPJ_DIGITS)).toBe(VALID_CNPJ);
  });

  it('generates numeric and alphanumeric headquarters numbers', () => {
    const numeric = cnpj.generate(sequenceRandom([1, 1, 2, 2, 2, 3, 3, 3]));
    expect(numeric).toBe(VALID_CNPJ_DIGITS);
    const alphanumeric = cnpj.generateAlphanumeric(sequenceRandom([10, 20, 30, 1]));
    expect(alphanumeric.slice(8, 12)).toBe('0001');
    expect(alphanumeric).toMatch(/[A-Z]/);
    expect(cnpj.validate(alphanumeric)).toEqual({ valid: true });
  });
});

import { describe, expect, it } from 'vitest';
import { Cpf } from '../../../src/domain/documents/Cpf';
import { sequenceRandom } from '../../fakes/random';
import { VALID_CPF, VALID_CPF_DIGITS } from '../../fakes/samples';

const cpf = new Cpf();

describe('Cpf', () => {
  it('describes itself', () => {
    expect([cpf.kind, cpf.label]).toEqual(['cpf', 'CPF']);
  });

  it('accepts valid numbers with or without mask', () => {
    expect(cpf.validate(VALID_CPF)).toEqual({ valid: true });
    expect(cpf.validate(VALID_CPF_DIGITS)).toEqual({ valid: true });
  });

  it.each([
    ['529.982.247-2a', { code: 'invalid-characters' }],
    ['529.982.247', { code: 'wrong-length', expected: 11, actual: 9 }],
    ['111.111.111-11', { code: 'repeated-characters' }],
    ['529.982.247-26', { code: 'invalid-check-digits', expected: '25', actual: '26' }],
  ])('rejects %s', (text, issue) => {
    expect(cpf.validate(text)).toEqual({ valid: false, issue });
  });

  it('identifies only CPF shapes', () => {
    expect(cpf.identifies(` ${VALID_CPF} `)).toBe(true);
    expect(cpf.identifies(VALID_CPF_DIGITS)).toBe(true);
    expect(cpf.identifies('5299822472')).toBe(false);
    expect(cpf.identifies('abc')).toBe(false);
  });

  it('normalizes and formats', () => {
    expect(cpf.normalize(VALID_CPF)).toBe(VALID_CPF_DIGITS);
    expect(cpf.format(VALID_CPF_DIGITS)).toBe(VALID_CPF);
  });

  it('generates valid numbers and skips repeated bases', () => {
    const repeatedThenVaried = sequenceRandom([...Array<number>(9).fill(3), 5, 2, 9, 9, 8, 2, 2, 4, 7]);
    const generated = cpf.generate(repeatedThenVaried);
    expect(generated).toBe(VALID_CPF_DIGITS);
    expect(repeatedThenVaried.calls).toHaveLength(18);
    expect(cpf.validate(cpf.generate(sequenceRandom([0, 1, 2, 3, 4, 5, 6, 7, 8])))).toEqual({ valid: true });
  });
});

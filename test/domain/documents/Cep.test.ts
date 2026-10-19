import { describe, expect, it } from 'vitest';
import { Cep } from '../../../src/domain/documents/Cep';
import { STATES } from '../../../src/domain/brazil/states';
import { lcgRandom } from '../../fakes/random';

const cep = new Cep();

describe('Cep', () => {
  it('identifies only the masked shape and accepts 8 digits', () => {
    expect(cep.identifies(' 01310-100 ')).toBe(true);
    expect(cep.identifies('01310100')).toBe(false);
    expect(cep.accepts('01310100')).toBe(true);
    expect(cep.accepts('01.310-100')).toBe(true);
    expect(cep.accepts('0131010')).toBe(false);
    expect(cep.accepts('01310-10a')).toBe(false);
  });

  it('validates against the Correios ranges', () => {
    expect(cep.validate('01310-100')).toEqual({ valid: true });
    expect(cep.validate('00000-100')).toEqual({ valid: false, issue: { code: 'unknown-range' } });
    expect(cep.validate('0131010')).toEqual({ valid: false, issue: { code: 'wrong-length', expected: 8, actual: 7 } });
    expect(cep.validate('01310-1OO')).toEqual({ valid: false, issue: { code: 'invalid-characters' } });
  });

  it('describes the city or the state', () => {
    expect(cep.details('01310-100')).toBe('São Paulo · SP');
    expect(cep.details('69900-000')).toMatch(/· AC$/);
    expect(cep.details('19999-999')).toBe('São Paulo · SP');
    expect(cep.details('00000-000')).toBeUndefined();
  });

  it('formats and generates valid values for any state', () => {
    expect(cep.normalize('01310-100')).toBe('01310100');
    expect(cep.format('01310100')).toBe('01310-100');
    const random = lcgRandom(5);
    for (let index = 0; index < 200; index += 1) {
      expect(cep.validate(cep.generate(random))).toEqual({ valid: true });
    }
    for (const state of STATES) {
      expect(cep.details(cep.generateFor(state.code, random))).toMatch(new RegExp(`· ${state.code}$`));
    }
  });
});

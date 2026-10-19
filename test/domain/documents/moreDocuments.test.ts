import { describe, expect, it } from 'vitest';
import { Cnh } from '../../../src/domain/documents/Cnh';
import { Cns } from '../../../src/domain/documents/Cns';
import { CreditCard } from '../../../src/domain/documents/CreditCard';
import { LicensePlate } from '../../../src/domain/documents/LicensePlate';
import { Pis } from '../../../src/domain/documents/Pis';
import { Renavam } from '../../../src/domain/documents/Renavam';
import { Rg } from '../../../src/domain/documents/Rg';
import { VoterTitle } from '../../../src/domain/documents/VoterTitle';
import { lcgRandom, sequenceRandom } from '../../fakes/random';

const cnh = new Cnh();
const pis = new Pis();
const renavam = new Renavam();
const title = new VoterTitle();
const rg = new Rg();
const cns = new Cns();
const plate = new LicensePlate();
const card = new CreditCard();

const valid = { valid: true };

describe('numeric documents', () => {
  it('describe themselves', () => {
    expect([cnh, pis, renavam, title, rg, cns, plate, card].map((type) => [type.kind, type.label])).toEqual([
      ['cnh', 'CNH'],
      ['pis', 'PIS/PASEP'],
      ['renavam', 'RENAVAM'],
      ['voter-title', 'Título de eleitor'],
      ['rg', 'RG (SP)'],
      ['cns', 'CNS'],
      ['license-plate', 'Placa'],
      ['credit-card', 'Cartão'],
    ]);
  });

  it('share the common checks', () => {
    expect(pis.validate('600.20666.26-a')).toEqual({ valid: false, issue: { code: 'invalid-characters' } });
    expect(pis.validate('600.20666.26')).toEqual({ valid: false, issue: { code: 'wrong-length', expected: 11, actual: 10 } });
    expect(pis.validate('111.11111.11-1')).toEqual({ valid: false, issue: { code: 'repeated-characters' } });
    expect(pis.accepts('600.20666.26-1')).toBe(true);
    expect(pis.accepts('600.20666.26')).toBe(false);
    expect(pis.accepts('abc')).toBe(false);
    expect(renavam.identifies('60020666261')).toBe(false);
    expect(renavam.format('6002066626-1')).toBe('60020666261');
  });
});

describe('Pis', () => {
  it('validates, formats and generates', () => {
    expect(pis.validate('600.20666.26-1')).toEqual(valid);
    expect(pis.validate('60020666262')).toEqual({ valid: false, issue: { code: 'invalid-check-digits', expected: '1', actual: '2' } });
    expect(pis.identifies('600.20666.26-1')).toBe(true);
    expect(pis.format('60020666261')).toBe('600.20666.26-1');
    expect(pis.validate(pis.generate(sequenceRandom([3, 1, 4, 1, 5, 9, 2, 6, 5, 3])))).toEqual(valid);
  });
});

describe('Renavam', () => {
  it('validates, including the remainder ten case, and generates', () => {
    expect(renavam.validate('60020666261')).toEqual(valid);
    expect(renavam.validate('00000712710')).toEqual(valid);
    expect(renavam.validate('60020666262')).toMatchObject({ valid: false, issue: { code: 'invalid-check-digits' } });
    expect(renavam.validate(renavam.generate(sequenceRandom([2, 7, 1, 8, 2, 8, 1, 8, 2, 8])))).toEqual(valid);
  });
});

describe('Cnh', () => {
  it('accepts both known check digit variants', () => {
    expect(cnh.validate('22660684802')).toEqual(valid);
    expect(cnh.validate('60567675400')).toEqual(valid);
    expect(cnh.validate('22660684803')).toMatchObject({ valid: false, issue: { code: 'invalid-check-digits', expected: '02', actual: '03' } });
  });

  it('runs every branch of the DENATRAN variant', () => {
    for (const base of ['073879281', '088715220', '605676754']) {
      expect(cnh.validate(`${base}99`).valid).toBe(false);
    }
  });

  it('generates only numbers valid under every variant', () => {
    const generated = cnh.generate(sequenceRandom([6, 0, 5, 6, 7, 6, 7, 5, 4, 2, 2, 6, 6, 0, 6, 8, 4, 8]));
    expect(generated).toBe('22660684802');
  });
});

describe('VoterTitle', () => {
  it('validates, including the special rule of SP and MG', () => {
    expect(title.validate('6002 0666 0914')).toEqual(valid);
    expect(title.validate('633072830141')).toEqual(valid);
    expect(title.validate('899218490213')).toEqual(valid);
    expect(title.validate('600206660915')).toMatchObject({ valid: false, issue: { code: 'invalid-check-digits' } });
  });

  it('rejects unknown state codes', () => {
    expect(title.validate('600206660014')).toEqual({ valid: false, issue: { code: 'invalid-format', expected: 'UF entre 01 e 28 nas posições 9 e 10' } });
    expect(title.validate('600206662914')).toMatchObject({ valid: false, issue: { code: 'invalid-format' } });
  });

  it('formats, identifies and generates by state or at random', () => {
    expect(title.format('600206660914')).toBe('6002 0666 0914');
    expect(title.identifies('6002 0666 0914')).toBe(true);
    const sp = title.generateFor(1, lcgRandom(42));
    expect(sp.slice(8, 10)).toBe('01');
    expect(title.validate(sp)).toEqual(valid);
    for (let seed = 1; seed <= 20; seed += 1) {
      expect(title.validate(title.generate(lcgRandom(seed)))).toEqual(valid);
      expect(title.validate(title.generateFor(2, lcgRandom(seed)))).toEqual(valid);
    }
  });
});

describe('Rg', () => {
  it('validates digits, X and zero check digits', () => {
    expect(rg.validate('60.020.666-X')).toEqual(valid);
    expect(rg.validate('00039595x')).toEqual(valid);
    expect(rg.validate('899218490')).toEqual(valid);
    expect(rg.validate('12.345.678-2')).toEqual(valid);
    expect(rg.validate('600206661')).toEqual({ valid: false, issue: { code: 'invalid-check-digits', expected: 'X', actual: '1' } });
  });

  it('rejects malformed values', () => {
    expect(rg.validate('60.020.666-!')).toEqual({ valid: false, issue: { code: 'invalid-characters' } });
    expect(rg.validate('6002066')).toEqual({ valid: false, issue: { code: 'wrong-length', expected: 9, actual: 7 } });
    expect(rg.validate('6002066X1')).toEqual({ valid: false, issue: { code: 'invalid-characters' } });
    expect(rg.validate('111111111')).toEqual({ valid: false, issue: { code: 'repeated-characters' } });
  });

  it('identifies, accepts, formats and generates', () => {
    expect(rg.identifies('60.020.666-X')).toBe(true);
    expect(rg.identifies('60020666X')).toBe(false);
    expect(rg.accepts('60020666X')).toBe(true);
    expect(rg.accepts('6002066X1')).toBe(false);
    expect(rg.format('60020666x')).toBe('60.020.666-X');
    const generated = rg.generate(sequenceRandom([...Array<number>(8).fill(4), 6, 0, 0, 2, 0, 6, 6, 6]));
    expect(generated).toBe('60020666X');
  });
});

describe('Cns', () => {
  it('validates definitive and provisional numbers', () => {
    expect(cns.validate('100 2066 6266 0005')).toEqual(valid);
    expect(cns.validate('100000950280018')).toEqual(valid);
    expect(cns.validate('700000000000005')).toEqual(valid);
    expect(cns.validate('300000000000003')).toEqual({ valid: false, issue: { code: 'invalid-prefix' } });
    expect(cns.validate('100206662660006')).toEqual({ valid: false, issue: { code: 'invalid-checksum' } });
  });

  it('formats, identifies and generates through both suffixes', () => {
    expect(cns.format('100206662660005')).toBe('100 2066 6266 0005');
    expect(cns.identifies('100 2066 6266 0005')).toBe(true);
    expect(cns.generate(sequenceRandom([0, 0, 0, 0, 0, 0, 9, 5, 0, 2, 8]))).toBe('100000950280018');
    expect(cns.generate(sequenceRandom([1, ...Array<number>(10).fill(0)]))).toBe('200000000000003');
  });
});

describe('LicensePlate', () => {
  it('accepts old and Mercosul plates and converts between them', () => {
    expect(plate.validate('abc-1234')).toEqual(valid);
    expect(plate.validate('ABC1C34')).toEqual(valid);
    expect(plate.validate('AB-1234')).toEqual({ valid: false, issue: { code: 'invalid-format', expected: 'ABC-1234 (antiga) ou ABC1D23 (Mercosul)' } });
    expect(plate.toMercosul('ABC-1234')).toBe('ABC1C34');
    expect(plate.toOld('ABC1C34')).toBe('ABC-1234');
    expect(plate.toOld('ABC1Z34')).toBeUndefined();
    expect(plate.details('ABC-1234')).toBe('antiga, equivale à Mercosul ABC1C34');
    expect(plate.details('ABC1C34')).toBe('Mercosul, equivale à antiga ABC-1234');
    expect(plate.details('ABC1Z34')).toBe('Mercosul');
  });

  it('formats, identifies and generates', () => {
    expect(plate.format('abc1234')).toBe('ABC-1234');
    expect(plate.format('abc1c34')).toBe('ABC1C34');
    expect(plate.identifies('ABC-1234')).toBe(true);
    expect(plate.identifies('ABC1C34')).toBe(true);
    expect(plate.identifies('ABC1234')).toBe(false);
    expect(plate.accepts('abc 1234')).toBe(true);
    expect(plate.accepts('abc_1234')).toBe(false);
    expect(plate.validate(plate.generate(sequenceRandom([4, 8, 20, 0, 14, 4, 2])))).toEqual(valid);
    expect(plate.generateOld(sequenceRandom([0, 1, 2, 3, 4, 5, 6]))).toBe('ABC3456');
  });
});

describe('CreditCard', () => {
  it('detects brands and validates with Luhn', () => {
    expect(card.validate('4111 1111 1111 1111')).toEqual(valid);
    expect(card.details('4111111111111111')).toBe('Visa');
    expect(card.details('5555555555554444')).toBe('Mastercard');
    expect(card.details('2221000000000009')).toBe('Mastercard');
    expect(card.details('378282246310005')).toBe('American Express');
    expect(card.details('6362970000457013')).toBe('Elo');
    expect(card.details('5090001234567890')).toBe('Elo');
    expect(card.details('6062824004288044')).toBe('Hipercard');
    expect(card.details('36400428804009')).toBe('Diners Club');
    expect(card.details('30500000000003')).toBe('Diners Club');
    expect(card.details('9999999999999995')).toBeUndefined();
    expect(card.details('5')).toBeUndefined();
  });

  it('rejects malformed numbers', () => {
    expect(card.validate('4111-1111-1111-111a')).toEqual({ valid: false, issue: { code: 'invalid-characters' } });
    expect(card.validate('4111')).toEqual({ valid: false, issue: { code: 'invalid-format', expected: 'entre 13 e 19 dígitos' } });
    expect(card.validate('41111111111111111111')).toMatchObject({ valid: false, issue: { code: 'invalid-format' } });
    expect(card.validate('1111111111111111')).toEqual({ valid: false, issue: { code: 'repeated-characters' } });
    expect(card.validate('4111111111111112')).toEqual({ valid: false, issue: { code: 'invalid-check-digits', expected: '1', actual: '2' } });
  });

  it('identifies, accepts and formats by length', () => {
    expect(card.identifies('4111 1111 1111 1111')).toBe(true);
    expect(card.identifies('3782 822463 10005')).toBe(true);
    expect(card.identifies('4111111111111111')).toBe(false);
    expect(card.accepts('4111111111111111')).toBe(true);
    expect(card.accepts('4111')).toBe(false);
    expect(card.accepts('4111 1111 1111 111x')).toBe(false);
    expect(card.format('4111111111111111')).toBe('4111 1111 1111 1111');
    expect(card.format('378282246310005')).toBe('3782 822463 10005');
    expect(card.format('36400428804009')).toBe('3640 042880 4009');
    expect(card.format('4111111111111')).toBe('4111 1111 1111 1');
  });

  it('generates valid numbers for each brand', () => {
    const random = sequenceRandom([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (const brand of ['visa', 'mastercard', 'amex', 'elo', 'hipercard', 'diners'] as const) {
      const generated = card.generateFor(brand, random);
      expect(card.validate(generated)).toEqual(valid);
    }
    expect(card.generate(random)).toMatch(/^4\d{15}$/);
  });
});

import { describe, expect, it } from 'vitest';
import { convertBoleto } from '../../../src/domain/boleto/convertBoleto';
import { decodeBoleto } from '../../../src/domain/boleto/decodeBoleto';
import { dueDateFromFactor, factorFromDueDate } from '../../../src/domain/boleto/dueDate';
import { bankLine, collectionLine, encodeBankBarcode, encodeCollectionBarcode } from '../../../src/domain/boleto/encodeBoleto';
import { bankModulo11, collectionModulo11, modulo10 } from '../../../src/domain/boleto/modulo';
import { OFFICIAL_BANK_BARCODE, OFFICIAL_BANK_LINE, TELECOM_COLLECTION_LINE, TODAY } from '../../fakes/samples';

describe('modulo', () => {
  it('computes the Febraban check digits', () => {
    expect(modulo10('001912345')).toBe('4');
    expect(modulo10('0')).toBe('0');
    expect(bankModulo11('0019963600001234001234567890123456789012345')).toBe('1');
    expect(bankModulo11('0')).toBe('1');
    expect(collectionModulo11('0')).toBe('0');
    expect(collectionModulo11('8')).toBe('6');
  });
});

describe('dueDate', () => {
  it('picks the factor cycle closest to today', () => {
    expect(dueDateFromFactor('9636', TODAY)).toBe('2024-02-24');
    expect(dueDateFromFactor('1000', TODAY)).toBe('2025-02-22');
    expect(dueDateFromFactor('9636', new Date('2045-01-01T00:00:00Z'))).toBe('2048-10-15');
    expect(dueDateFromFactor('0000', TODAY)).toBeUndefined();
  });

  it('converts dates back to factors in both cycles', () => {
    expect(factorFromDueDate('2024-02-24')).toBe('9636');
    expect(factorFromDueDate('2025-02-22')).toBe('1000');
    expect(factorFromDueDate('2026-11-10')).toBe('1626');
  });
});

describe('decodeBoleto', () => {
  it('decodes the official bank example from the line and from the barcode', () => {
    const expected = {
      boleto: {
        kind: 'bank',
        barcode: OFFICIAL_BANK_BARCODE,
        line: '00191234546789012345767890123457196360000123400',
        bankCode: '001',
        segment: undefined,
        amount: '1234.00',
        amountIsReference: false,
        dueDate: '2024-02-24',
      },
      issues: [],
    };
    expect(decodeBoleto(OFFICIAL_BANK_LINE, TODAY)).toEqual(expected);
    expect(decodeBoleto(OFFICIAL_BANK_BARCODE, TODAY)).toEqual(expected);
  });

  it('decodes a real collection line', () => {
    expect(decodeBoleto(TELECOM_COLLECTION_LINE, TODAY)).toEqual({
      boleto: {
        kind: 'collection',
        barcode: '84670000001435900240200240500024384221010811',
        line: TELECOM_COLLECTION_LINE,
        bankCode: undefined,
        segment: '4',
        amount: '143.59',
        amountIsReference: false,
        dueDate: undefined,
      },
      issues: [],
    });
  });

  it('round-trips encoded boletos of every collection value type', () => {
    const bank = encodeBankBarcode({ bankCode: '341', amountCents: 15000, dueDate: '2026-11-10', freeField: '1'.repeat(25) });
    expect(decodeBoleto(bankLine(bank), TODAY)).toMatchObject({ boleto: { amount: '150.00', dueDate: '2026-11-10' }, issues: [] });
    const free = encodeBankBarcode({ bankCode: '237', amountCents: 0, dueDate: undefined, freeField: '2'.repeat(25) });
    expect(decodeBoleto(free, TODAY)).toMatchObject({ boleto: { amount: undefined, dueDate: undefined }, issues: [] });
    for (const valueType of ['6', '7', '8', '9'] as const) {
      const barcode = encodeCollectionBarcode({ segment: '3', valueType, amountCents: 12345, freeField: '9'.repeat(29) });
      expect(decodeBoleto(collectionLine(barcode), TODAY)).toMatchObject({
        boleto: { segment: '3', amount: '123.45', amountIsReference: valueType === '7' || valueType === '9' },
        issues: [],
      });
    }
  });

  it('reports broken field digits, general digit and currency', () => {
    const brokenFields = OFFICIAL_BANK_LINE.replace('00191.23454', '00191.23455').replace('67890.123457 67890', '67890.123450 67890');
    expect(decodeBoleto(brokenFields, TODAY).issues).toEqual([
      { code: 'invalid-field-check-digit', field: 1, expected: '4', actual: '5' },
      { code: 'invalid-field-check-digit', field: 2, expected: '7', actual: '0' },
    ]);
    expect(decodeBoleto(`${OFFICIAL_BANK_BARCODE.slice(0, 3)}8${OFFICIAL_BANK_BARCODE.slice(4)}`, TODAY).issues).toEqual([{ code: 'invalid-currency', actual: '8' }]);
    expect(decodeBoleto(`${OFFICIAL_BANK_BARCODE.slice(0, 4)}5${OFFICIAL_BANK_BARCODE.slice(5)}`, TODAY).issues).toEqual([
      { code: 'invalid-check-digit', expected: '1', actual: '5' },
    ]);
    const brokenCollection = TELECOM_COLLECTION_LINE.slice(0, -1) + '0';
    expect(decodeBoleto(brokenCollection, TODAY).issues).toEqual([{ code: 'invalid-field-check-digit', field: 4, expected: '9', actual: '0' }]);
    expect(decodeBoleto('84690000001435900240200240500024384221010811', TODAY).issues).toEqual([{ code: 'invalid-check-digit', expected: '7', actual: '9' }]);
    expect(decodeBoleto('85500000001435900240200240500024384221010811', TODAY).issues).toEqual([{ code: 'invalid-value-type', actual: '5' }]);
  });

  it('rejects other characters and lengths', () => {
    expect(decodeBoleto('0019x', TODAY)).toEqual({ boleto: undefined, issues: [{ code: 'invalid-characters' }] });
    expect(decodeBoleto('123', TODAY)).toEqual({ boleto: undefined, issues: [{ code: 'invalid-length', actual: 3 }] });
    expect(decodeBoleto('1'.repeat(48), TODAY)).toEqual({ boleto: undefined, issues: [{ code: 'invalid-length', actual: 48 }] });
  });
});

describe('convertBoleto', () => {
  it('converts lines to barcodes and back', () => {
    expect(convertBoleto(OFFICIAL_BANK_LINE, TODAY)).toBe(OFFICIAL_BANK_BARCODE);
    expect(convertBoleto(OFFICIAL_BANK_BARCODE, TODAY)).toBe('00191234546789012345767890123457196360000123400');
    expect(convertBoleto('abc', TODAY)).toBeUndefined();
  });
});

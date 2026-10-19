import { dueDateFromFactor } from './dueDate';
import { bankModulo11, collectionModulo11, modulo10 } from './modulo';
import type { Boleto, BoletoIssue, BoletoKind } from './types';

export interface BoletoFormat {
  readonly kind: BoletoKind;
  readonly barcodeLength: 44;
  readonly lineLength: number;
  handles(digits: string): boolean;
  barcodeFromLine(line: string): string;
  lineFromBarcode(barcode: string): string;
  fieldIssues(line: string): readonly BoletoIssue[];
  barcodeIssues(barcode: string): readonly BoletoIssue[];
  describe(barcode: string, today: Date): Boleto;
}

const centsToAmount = (cents: string): string | undefined => {
  const value = Number(cents);
  return value === 0 ? undefined : (value / 100).toFixed(2);
};

const fieldIssue = (field: number, payload: string, actual: string, compute: (digits: string) => string): readonly BoletoIssue[] => {
  const expected = compute(payload);
  return expected === actual ? [] : [{ code: 'invalid-field-check-digit', field, expected, actual }];
};

export const BANK_FORMAT: BoletoFormat = {
  kind: 'bank',
  barcodeLength: 44,
  lineLength: 47,
  handles: (digits) => digits.charAt(0) !== '8',
  barcodeFromLine: (line) => `${line.slice(0, 4)}${line.charAt(32)}${line.slice(33, 47)}${line.slice(4, 9)}${line.slice(10, 20)}${line.slice(21, 31)}`,
  lineFromBarcode: (barcode) => {
    const first = `${barcode.slice(0, 4)}${barcode.slice(19, 24)}`;
    const second = barcode.slice(24, 34);
    const third = barcode.slice(34, 44);
    return `${first}${modulo10(first)}${second}${modulo10(second)}${third}${modulo10(third)}${barcode.charAt(4)}${barcode.slice(5, 19)}`;
  },
  fieldIssues: (line) => [
    ...fieldIssue(1, line.slice(0, 9), line.charAt(9), modulo10),
    ...fieldIssue(2, line.slice(10, 20), line.charAt(20), modulo10),
    ...fieldIssue(3, line.slice(21, 31), line.charAt(31), modulo10),
  ],
  barcodeIssues: (barcode) => {
    const issues: BoletoIssue[] = [];
    const currency = barcode.charAt(3);
    if (currency !== '9') {
      issues.push({ code: 'invalid-currency', actual: currency });
    }
    const expected = bankModulo11(`${barcode.slice(0, 4)}${barcode.slice(5)}`);
    const actual = barcode.charAt(4);
    return expected === actual ? issues : [...issues, { code: 'invalid-check-digit', expected, actual }];
  },
  describe: (barcode, today) => ({
    kind: 'bank',
    barcode,
    line: BANK_FORMAT.lineFromBarcode(barcode),
    bankCode: barcode.slice(0, 3),
    segment: undefined,
    amount: centsToAmount(barcode.slice(9, 19)),
    amountIsReference: false,
    dueDate: dueDateFromFactor(barcode.slice(5, 9), today),
  }),
};

const collectionModulo = (valueType: string): ((digits: string) => string) => (valueType === '6' || valueType === '7' ? modulo10 : collectionModulo11);

const isKnownValueType = (valueType: string): boolean => ['6', '7', '8', '9'].includes(valueType);

const BLOCKS = [0, 1, 2, 3] as const;

export const COLLECTION_FORMAT: BoletoFormat = {
  kind: 'collection',
  barcodeLength: 44,
  lineLength: 48,
  handles: (digits) => digits.charAt(0) === '8',
  barcodeFromLine: (line) => BLOCKS.map((block) => line.slice(block * 12, block * 12 + 11)).join(''),
  lineFromBarcode: (barcode) => {
    const compute = collectionModulo(barcode.charAt(2));
    return BLOCKS.map((block) => {
      const payload = barcode.slice(block * 11, block * 11 + 11);
      return `${payload}${compute(payload)}`;
    }).join('');
  },
  fieldIssues: (line) => {
    const compute = collectionModulo(line.charAt(2));
    return BLOCKS.flatMap((block) => fieldIssue(block + 1, line.slice(block * 12, block * 12 + 11), line.charAt(block * 12 + 11), compute));
  },
  barcodeIssues: (barcode) => {
    const valueType = barcode.charAt(2);
    if (!isKnownValueType(valueType)) {
      return [{ code: 'invalid-value-type', actual: valueType }];
    }
    const expected = collectionModulo(valueType)(`${barcode.slice(0, 3)}${barcode.slice(4)}`);
    const actual = barcode.charAt(3);
    return expected === actual ? [] : [{ code: 'invalid-check-digit', expected, actual }];
  },
  describe: (barcode) => {
    const valueType = barcode.charAt(2);
    return {
      kind: 'collection',
      barcode,
      line: COLLECTION_FORMAT.lineFromBarcode(barcode),
      bankCode: undefined,
      segment: barcode.charAt(1),
      amount: centsToAmount(barcode.slice(4, 15)),
      amountIsReference: valueType === '7' || valueType === '9',
      dueDate: undefined,
    };
  },
};

export const BOLETO_FORMATS: readonly BoletoFormat[] = [COLLECTION_FORMAT, BANK_FORMAT];

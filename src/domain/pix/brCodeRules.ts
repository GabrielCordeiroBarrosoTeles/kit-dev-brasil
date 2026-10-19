import { crc16Ccitt } from './crc16';
import type { TlvField } from './tlv';
import type { BrCodeField, BrCodeIssue } from './types';

export interface BrCodeContext {
  readonly input: string;
  readonly fields: ReadonlyMap<string, string>;
  readonly account: ReadonlyMap<string, string>;
  readonly crcField: TlvField | undefined;
}

export type BrCodeRule = (context: BrCodeContext) => readonly BrCodeIssue[];

export const PIX_GUI = 'br.gov.bcb.pix';
const CRC_TAG = '6304';
const AMOUNT = /^\d{1,10}(\.\d{1,2})?$/;

const required =
  (id: string, field: BrCodeField): BrCodeRule =>
  ({ fields }) =>
    fields.has(id) ? [] : [{ code: 'missing-field', field }];

const expectedValue =
  (id: string, field: BrCodeField, expected: string): BrCodeRule =>
  ({ fields }) => {
    const actual = fields.get(id);
    return actual === undefined || actual === expected ? [] : [{ code: 'unexpected-value', field, expected, actual }];
  };

const maxLength =
  (id: string, field: BrCodeField, max: number): BrCodeRule =>
  ({ fields }) => {
    const actual = fields.get(id)?.length ?? 0;
    return actual > max ? [{ code: 'too-long', field, max, actual }] : [];
  };

const guiRule: BrCodeRule = ({ fields, account }) => {
  if (!fields.has('26')) {
    return [];
  }
  const actual = account.get('00');
  if (actual === undefined) {
    return [{ code: 'missing-field', field: 'gui' }];
  }
  return actual.toLowerCase() === PIX_GUI ? [] : [{ code: 'unexpected-value', field: 'gui', expected: PIX_GUI, actual }];
};

const keyOrUrlRule: BrCodeRule = ({ fields, account }) =>
  !fields.has('26') || account.has('01') || account.has('25') ? [] : [{ code: 'missing-field', field: 'key-or-url' }];

const amountRule: BrCodeRule = ({ fields }) => {
  const actual = fields.get('54');
  return actual === undefined || AMOUNT.test(actual) ? [] : [{ code: 'invalid-amount', actual }];
};

const crcRule: BrCodeRule = ({ input, crcField }) => {
  if (!crcField || crcField.start + CRC_TAG.length + crcField.value.length !== input.length) {
    return [{ code: 'missing-field', field: 'crc' }];
  }
  const expected = crc16Ccitt(input.slice(0, crcField.start + CRC_TAG.length));
  const actual = crcField.value.toUpperCase();
  return expected === actual ? [] : [{ code: 'invalid-crc', expected, actual }];
};

export const BR_CODE_RULES: readonly BrCodeRule[] = [
  required('00', 'payload-format'),
  expectedValue('00', 'payload-format', '01'),
  required('26', 'merchant-account'),
  guiRule,
  keyOrUrlRule,
  required('52', 'mcc'),
  required('53', 'currency'),
  expectedValue('53', 'currency', '986'),
  amountRule,
  required('58', 'country'),
  expectedValue('58', 'country', 'BR'),
  required('59', 'merchant-name'),
  maxLength('59', 'merchant-name', 25),
  required('60', 'merchant-city'),
  maxLength('60', 'merchant-city', 15),
  crcRule,
];

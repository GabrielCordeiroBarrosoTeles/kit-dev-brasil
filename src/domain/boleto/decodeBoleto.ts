import { BOLETO_FORMATS } from './formats';
import type { BoletoFormat } from './formats';
import type { BoletoDecoding } from './types';

const ALLOWED = /^[\d.\s-]*$/;

const formatFor = (digits: string): { readonly format: BoletoFormat; readonly isLine: boolean } | undefined => {
  for (const format of BOLETO_FORMATS) {
    if (format.handles(digits) && (digits.length === format.barcodeLength || digits.length === format.lineLength)) {
      return { format, isLine: digits.length === format.lineLength };
    }
  }
  return undefined;
};

export const decodeBoleto = (text: string, today: Date): BoletoDecoding => {
  if (!ALLOWED.test(text)) {
    return { boleto: undefined, issues: [{ code: 'invalid-characters' }] };
  }
  const digits = text.replace(/\D/g, '');
  const match = formatFor(digits);
  if (!match) {
    return { boleto: undefined, issues: [{ code: 'invalid-length', actual: digits.length }] };
  }
  const { format, isLine } = match;
  const barcode = isLine ? format.barcodeFromLine(digits) : digits;
  const issues = [...(isLine ? format.fieldIssues(digits) : []), ...format.barcodeIssues(barcode)];
  return { boleto: format.describe(barcode, today), issues };
};

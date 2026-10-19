import { factorFromDueDate } from './dueDate';
import { COLLECTION_FORMAT, BANK_FORMAT } from './formats';
import { bankModulo11, collectionModulo11, modulo10 } from './modulo';

export interface BankBoletoInput {
  readonly bankCode: string;
  readonly amountCents: number;
  readonly dueDate: string | undefined;
  readonly freeField: string;
}

export interface CollectionBoletoInput {
  readonly segment: string;
  readonly valueType: '6' | '7' | '8' | '9';
  readonly amountCents: number;
  readonly freeField: string;
}

export const encodeBankBarcode = ({ bankCode, amountCents, dueDate, freeField }: BankBoletoInput): string => {
  const factor = dueDate === undefined ? '0000' : factorFromDueDate(dueDate);
  const payload = `${bankCode}9${factor}${String(amountCents).padStart(10, '0')}${freeField}`;
  return `${payload.slice(0, 4)}${bankModulo11(payload)}${payload.slice(4)}`;
};

export const encodeCollectionBarcode = ({ segment, valueType, amountCents, freeField }: CollectionBoletoInput): string => {
  const payload = `8${segment}${valueType}${String(amountCents).padStart(11, '0')}${freeField}`;
  const digit = valueType === '6' || valueType === '7' ? modulo10(payload) : collectionModulo11(payload);
  return `${payload.slice(0, 3)}${digit}${payload.slice(3)}`;
};

export const bankLine = (barcode: string): string => BANK_FORMAT.lineFromBarcode(barcode);

export const collectionLine = (barcode: string): string => COLLECTION_FORMAT.lineFromBarcode(barcode);

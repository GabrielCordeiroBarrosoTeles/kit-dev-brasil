import type { BrCode } from '../domain/pix/types';
import type { FieldRow } from '../shared/sidebarProtocol';
import { INITIATION_LABELS, KEY_TYPE_LABELS } from './messages';

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const present = (value: string | undefined): string | undefined => (value === undefined || value === '' ? undefined : value);

export const formatAmount = (amount: string): string => {
  const value = Number(amount);
  return Number.isFinite(value) ? currency.format(value) : amount;
};

const describeKey = ({ key, keyType }: BrCode): string | undefined => {
  const value = present(key);
  if (value === undefined) {
    return undefined;
  }
  return keyType === undefined ? value : `${value} (${KEY_TYPE_LABELS[keyType]})`;
};

export const describePixFields = (brCode: BrCode): FieldRow[] => {
  const rows: readonly (readonly [string, string | undefined])[] = [
    ['Chave', describeKey(brCode)],
    ['URL', present(brCode.url)],
    ['Valor', brCode.amount === undefined ? 'livre (quem paga digita)' : formatAmount(brCode.amount)],
    ['Recebedor', present(brCode.merchantName)],
    ['Cidade', present(brCode.merchantCity)],
    ['CEP', present(brCode.postalCode)],
    ['Descrição', present(brCode.description)],
    ['Identificador (txid)', present(brCode.txid)],
    ['Tipo', brCode.initiation === undefined ? undefined : INITIATION_LABELS[brCode.initiation]],
    ['CRC', present(brCode.crc)],
  ];
  return rows.filter((row): row is FieldRow => row[1] !== undefined);
};

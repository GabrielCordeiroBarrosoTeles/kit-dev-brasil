import { BANK_NAMES, COLLECTION_SEGMENTS } from '../domain/boleto/banks';
import type { Boleto } from '../domain/boleto/types';
import type { FieldRow } from '../shared/sidebarProtocol';
import { formatAmount } from './pixFields';

const DAY_MS = 86_400_000;

export const formatBoletoLine = (boleto: Boleto): string => {
  const line = boleto.line;
  if (boleto.kind === 'collection') {
    return [0, 1, 2, 3].map((block) => `${line.slice(block * 12, block * 12 + 11)}-${line.charAt(block * 12 + 11)}`).join(' ');
  }
  return `${line.slice(0, 5)}.${line.slice(5, 10)} ${line.slice(10, 15)}.${line.slice(15, 21)} ${line.slice(21, 26)}.${line.slice(26, 32)} ${line.charAt(32)} ${line.slice(33)}`;
};

export const formatDate = (isoDate: string): string => `${isoDate.slice(8, 10)}/${isoDate.slice(5, 7)}/${isoDate.slice(0, 4)}`;

export const describeDueDate = (isoDate: string, today: Date): string => {
  const due = Date.parse(`${isoDate}T00:00:00Z`);
  const now = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const days = Math.round((due - now) / DAY_MS);
  const date = formatDate(isoDate);
  if (days === 0) {
    return `${date} (vence hoje)`;
  }
  const plural = Math.abs(days) === 1 ? 'dia' : 'dias';
  return days > 0 ? `${date} (vence em ${days} ${plural})` : `${date} (vencido há ${-days} ${plural})`;
};

export const describeBank = (code: string): string => {
  const name = BANK_NAMES[code];
  return name === undefined ? code : `${code} · ${name}`;
};

const describeKind = (boleto: Boleto): string => {
  if (boleto.kind === 'bank') {
    return 'bancário';
  }
  const segment = COLLECTION_SEGMENTS[boleto.segment ?? ''];
  return segment === undefined ? 'arrecadação' : `arrecadação · ${segment}`;
};

export const describeBoletoAmount = (boleto: Boleto): string => {
  if (boleto.amount === undefined) {
    return 'livre (quem paga digita)';
  }
  return boleto.amountIsReference ? `${boleto.amount} (valor de referência)` : formatAmount(boleto.amount);
};

export const describeBoletoFields = (boleto: Boleto, today: Date): FieldRow[] => {
  const rows: readonly (readonly [string, string | undefined])[] = [
    ['Tipo', describeKind(boleto)],
    ['Banco', boleto.bankCode === undefined ? undefined : describeBank(boleto.bankCode)],
    ['Valor', describeBoletoAmount(boleto)],
    ['Vencimento', boleto.kind === 'bank' ? (boleto.dueDate === undefined ? 'sem vencimento' : describeDueDate(boleto.dueDate, today)) : undefined],
    ['Linha digitável', formatBoletoLine(boleto)],
    ['Código de barras', boleto.barcode],
  ];
  return rows.filter((row): row is FieldRow => row[1] !== undefined);
};

import type { BatchColumn, BatchFormat, BatchRecord, BatchRequest, BatchValue } from '../application/batch/types';
import { literal } from './profileExporters';

export const BATCH_FORMATS: readonly BatchFormat[] = ['json', 'csv', 'sql', 'typescript'];

export const BATCH_FORMAT_LABELS: Readonly<Record<BatchFormat, string>> = { json: 'JSON', csv: 'CSV', sql: 'SQL (INSERT)', typescript: 'Array TypeScript' };

export const BATCH_LANGUAGES: Readonly<Record<BatchFormat, string>> = { json: 'json', csv: 'plaintext', sql: 'sql', typescript: 'typescript' };

export interface RenderedBatch {
  readonly content: string;
  readonly language: string;
}

type Exporter = (records: readonly BatchRecord[], columns: readonly BatchColumn[], name: string) => string;

const CSV_SPECIAL = /[",\r\n]/;

const csvCell = (value: BatchValue): string => {
  const text = value === undefined ? '' : String(value);
  return CSV_SPECIAL.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const sqlCell = (value: BatchValue): string => {
  if (value === undefined) {
    return 'NULL';
  }
  return typeof value === 'number' ? String(value) : `'${value.replace(/'/g, "''")}'`;
};

const tsCell = (value: BatchValue): string => (value === undefined ? 'null' : literal(value));

const row = (record: BatchRecord, columns: readonly BatchColumn[]): BatchValue[] => columns.map(({ key }) => record[key]);

const EXPORTERS: Readonly<Record<BatchFormat, Exporter>> = {
  json: (records, columns) => JSON.stringify(records.map((record) => Object.fromEntries(columns.map(({ key, column }) => [column, record[key] ?? null]))), null, 2),
  csv: (records, columns) => [columns.map(({ column }) => column).join(','), ...records.map((record) => row(record, columns).map(csvCell).join(','))].join('\n'),
  sql: (records, columns, name) =>
    `INSERT INTO ${name} (${columns.map(({ column }) => column).join(', ')}) VALUES\n${records.map((record) => `  (${row(record, columns).map(sqlCell).join(', ')})`).join(',\n')};`,
  typescript: (records, columns, name) =>
    [`export const ${name} = [`, ...records.map((record) => ['  {', ...columns.map(({ key, column }) => `    ${column}: ${tsCell(record[key])},`), '  },'].join('\n')), '];'].join('\n'),
};

export const renderBatch = (records: readonly BatchRecord[], { format, columns, name }: BatchRequest): RenderedBatch => ({
  content: EXPORTERS[format](records, columns, name),
  language: BATCH_LANGUAGES[format],
});

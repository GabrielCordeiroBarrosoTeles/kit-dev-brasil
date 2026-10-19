import type { BatchColumn, BatchFormat, BatchRequest, BatchSource } from '../application/batch/types';
import { isGeneratorId } from '../application/generation/generatorIds';
import { isStateCode } from '../domain/brazil/states';
import { batchColumns, defaultBatchName } from './batchColumns';
import { BATCH_FORMATS } from './batchExporters';

export const MIN_BATCH_COUNT = 1;
export const MAX_BATCH_COUNT = 1000;

export type BatchIssue =
  | { readonly code: 'invalid-source' }
  | { readonly code: 'invalid-count'; readonly min: number; readonly max: number }
  | { readonly code: 'invalid-format' }
  | { readonly code: 'invalid-name'; readonly name: string }
  | { readonly code: 'invalid-column'; readonly column: string }
  | { readonly code: 'no-columns' };

export interface BatchParsing {
  readonly request: BatchRequest | undefined;
  readonly issues: readonly BatchIssue[];
}

export type BatchTemplate = Omit<BatchRequest, 'columns' | 'state' | 'seed'> & {
  readonly state?: string;
  readonly seed?: string;
  readonly columns: Readonly<Record<string, string>>;
};

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

export const isIdentifier = (text: string): boolean => IDENTIFIER.test(text);

const asRecord = (value: unknown): Readonly<Record<string, unknown>> => (typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {});

const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const isBatchSource = (value: unknown): value is BatchSource => value === 'person' || value === 'company' || isGeneratorId(value);

const isBatchFormat = (value: unknown): value is BatchFormat => (BATCH_FORMATS as readonly unknown[]).includes(value);

const toEntries = (value: unknown): readonly (readonly [string, string])[] | undefined => {
  if (Array.isArray(value)) {
    return value.map((item) => [text(asRecord(item).key), text(asRecord(item).column)] as const);
  }
  return typeof value === 'object' && value !== null ? Object.entries(value).map(([key, column]) => [key, text(column)] as const) : undefined;
};

const parseColumns = (source: BatchSource, value: unknown): readonly BatchColumn[] => {
  const known = batchColumns(source).map(({ key }) => key);
  const entries = toEntries(value) ?? known.map((key) => [key, key] as const);
  return entries.filter(([key]) => known.includes(key)).map(([key, column]) => ({ key, column: column === '' ? key : column }));
};

const parseCount = (value: unknown): number | undefined => {
  const count = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  return typeof count === 'number' && Number.isInteger(count) && count >= MIN_BATCH_COUNT && count <= MAX_BATCH_COUNT ? count : undefined;
};

export const isValidBatchCount = (value: unknown): boolean => parseCount(value) !== undefined;

export const toBatchRequest = (input: unknown): BatchParsing => {
  const raw = asRecord(input);
  const { source, format } = raw;
  const count = parseCount(raw.count);
  if (!isBatchSource(source)) {
    return { request: undefined, issues: [{ code: 'invalid-source' }] };
  }
  const columns = parseColumns(source, raw.columns);
  const name = text(raw.name) === '' ? defaultBatchName(source) : text(raw.name);
  const seed = text(raw.seed);
  const issues: BatchIssue[] = [
    ...(count === undefined ? [{ code: 'invalid-count', min: MIN_BATCH_COUNT, max: MAX_BATCH_COUNT } as const] : []),
    ...(isBatchFormat(format) ? [] : [{ code: 'invalid-format' } as const]),
    ...(isIdentifier(name) ? [] : [{ code: 'invalid-name', name } as const]),
    ...(columns.length === 0 ? [{ code: 'no-columns' } as const] : []),
    ...columns.filter(({ column }) => !isIdentifier(column)).map(({ column }) => ({ code: 'invalid-column', column }) as const),
  ];
  if (count === undefined || !isBatchFormat(format) || issues.length > 0) {
    return { request: undefined, issues };
  }
  return {
    request: { source, count, format, name, columns, state: isStateCode(raw.state) ? raw.state : undefined, formatted: raw.formatted !== false, seed: seed === '' ? undefined : seed },
    issues: [],
  };
};

export const toBatchTemplate = ({ columns, state, seed, ...rest }: BatchRequest): BatchTemplate => ({
  ...rest,
  ...(state === undefined ? {} : { state }),
  ...(seed === undefined ? {} : { seed }),
  columns: Object.fromEntries(columns.map(({ key, column }) => [key, column])),
});

export interface NamedBatchRequest {
  readonly name: string;
  readonly request: BatchRequest;
}

export const validTemplates = (templates: Readonly<Record<string, unknown>>): readonly NamedBatchRequest[] =>
  Object.entries(templates).flatMap(([name, template]) => {
    const { request } = toBatchRequest(template);
    return request === undefined ? [] : [{ name, request }];
  });

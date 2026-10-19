import type { StateCode } from '../../domain/brazil/types';
import type { RandomSource } from '../../domain/shared/types';
import type { GeneratorId } from '../generation/generatorIds';
import type { GenerationOptions } from '../people/types';

export type ProfileSource = 'person' | 'company';

export type BatchSource = ProfileSource | GeneratorId;

export type BatchFormat = 'json' | 'csv' | 'sql' | 'typescript';

export interface BatchColumn {
  readonly key: string;
  readonly column: string;
}

export interface BatchRequest {
  readonly source: BatchSource;
  readonly count: number;
  readonly state: StateCode | undefined;
  readonly formatted: boolean;
  readonly seed: string | undefined;
  readonly format: BatchFormat;
  readonly name: string;
  readonly columns: readonly BatchColumn[];
}

export type BatchValue = string | number | undefined;

export type BatchRecord = Readonly<Record<string, BatchValue>>;

export type RecordFactory = (source: BatchSource, random: RandomSource, today: Date, options: GenerationOptions) => () => BatchRecord;

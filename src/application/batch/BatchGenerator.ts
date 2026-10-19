import { SeededRandom, seedFromText } from '../../domain/shared/seededRandom';
import type { RandomSource } from '../../domain/shared/types';
import type { BatchRecord, BatchRequest, RecordFactory } from './types';

export const SEED_REFERENCE_DATE = new Date('2026-01-01T12:00:00Z');

export class BatchGenerator {
  constructor(
    private readonly factory: RecordFactory,
    private readonly random: RandomSource,
    private readonly today: () => Date,
  ) {}

  generate({ source, count, state, formatted, seed }: BatchRequest): readonly BatchRecord[] {
    const random = seed === undefined ? this.random : new SeededRandom(seedFromText(seed));
    const today = seed === undefined ? this.today() : SEED_REFERENCE_DATE;
    const next = this.factory(source, random, today, { state, formatted });
    return Array.from({ length: count }, () => next());
  }
}

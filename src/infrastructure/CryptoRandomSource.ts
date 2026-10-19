import { randomInt } from 'node:crypto';
import type { RandomSource } from '../domain/shared/types';

export class CryptoRandomSource implements RandomSource {
  constructor(private readonly secureRandomInt: (maxExclusive: number) => number = randomInt) {}

  nextInt(maxExclusive: number): number {
    return this.secureRandomInt(maxExclusive);
  }
}

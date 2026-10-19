import type { RandomSource } from './types';

const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;
const MULBERRY_INCREMENT = 0x6d2b79f5;
const UINT32_RANGE = 2 ** 32;

export const seedFromText = (text: string): number =>
  Array.from(text, (char) => char.charCodeAt(0)).reduce((hash, code) => Math.imul(hash ^ code, FNV_PRIME) >>> 0, FNV_OFFSET);

export class SeededRandom implements RandomSource {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  nextInt(maxExclusive: number): number {
    this.state = (this.state + MULBERRY_INCREMENT) >>> 0;
    let mixed = this.state;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return Math.floor((((mixed ^ (mixed >>> 14)) >>> 0) / UINT32_RANGE) * maxExclusive);
  }
}

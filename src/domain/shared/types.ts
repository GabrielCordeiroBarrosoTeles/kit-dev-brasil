export interface RandomSource {
  nextInt(maxExclusive: number): number;
}

export type WeightAt = (index: number, length: number) => number;

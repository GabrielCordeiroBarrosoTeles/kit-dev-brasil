import type { WeightAt } from './types';

const MODULUS = 11;

export const mod11CheckDigit = (values: readonly number[], weightAt: WeightAt): number => {
  const sum = values.reduce((total, value, index) => total + value * weightAt(index, values.length), 0);
  const remainder = sum % MODULUS;
  return remainder < 2 ? 0 : MODULUS - remainder;
};

export const descendingWeights: WeightAt = (index, length) => length + 1 - index;

export const cyclicWeightsFromRight =
  (min: number, max: number): WeightAt =>
  (index, length) =>
    min + ((length - 1 - index) % (max - min + 1));

import type { WeightAt } from './types';

const MODULUS = 11;

export const weightedSum = (values: readonly number[], weightAt: WeightAt): number =>
  values.reduce((total, value, index) => total + value * weightAt(index, values.length), 0);

export const mod11CheckDigit = (values: readonly number[], weightAt: WeightAt): number => {
  const remainder = weightedSum(values, weightAt) % MODULUS;
  return remainder < 2 ? 0 : MODULUS - remainder;
};

export const descendingWeights: WeightAt = (index, length) => length + 1 - index;

export const ascendingWeights =
  (start: number): WeightAt =>
  (index) =>
    start + index;

export const cyclicWeightsFromRight =
  (min: number, max: number): WeightAt =>
  (index, length) =>
    min + ((length - 1 - index) % (max - min + 1));

export const toDigits = (text: string): number[] => [...text].map(Number);

export const luhnCheckDigit = (payload: string): number => {
  const sum = toDigits(payload)
    .reverse()
    .reduce((total, digit, index) => {
      if (index % 2 !== 0) {
        return total + digit;
      }
      const doubled = digit * 2;
      return total + (doubled > 9 ? doubled - 9 : doubled);
    }, 0);
  return (10 - (sum % 10)) % 10;
};

import type { RandomSource } from '../../src/domain/shared/types';

export const sequenceRandom = (values: readonly number[]): RandomSource & { readonly calls: number[] } => {
  let index = 0;
  const calls: number[] = [];
  return {
    calls,
    nextInt: (maxExclusive: number) => {
      calls.push(maxExclusive);
      const value = values[index % values.length] ?? 0;
      index += 1;
      return value % maxExclusive;
    },
  };
};

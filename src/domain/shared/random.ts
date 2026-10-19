import type { RandomSource } from './types';

const DIGITS = '0123456789';
const ALPHANUMERIC = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export const randomFrom = (alphabet: string, length: number, random: RandomSource): string =>
  Array.from({ length }, () => alphabet.charAt(random.nextInt(alphabet.length))).join('');

export const randomDigits = (length: number, random: RandomSource): string => randomFrom(DIGITS, length, random);

export const randomAlphanumeric = (length: number, random: RandomSource): string => randomFrom(ALPHANUMERIC, length, random);

export type NonEmpty<T> = readonly [T, ...T[]];

export const pick = <T>(items: NonEmpty<T>, random: RandomSource): T => {
  const index = random.nextInt(items.length);
  return items.reduce((chosen, item, position) => (position === index ? item : chosen), items[0]);
};

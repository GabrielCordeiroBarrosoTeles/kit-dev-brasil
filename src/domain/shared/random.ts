import type { RandomSource } from './types';

const DIGITS = '0123456789';
const ALPHANUMERIC = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export const randomFrom = (alphabet: string, length: number, random: RandomSource): string =>
  Array.from({ length }, () => alphabet.charAt(random.nextInt(alphabet.length))).join('');

export const randomDigits = (length: number, random: RandomSource): string => randomFrom(DIGITS, length, random);

export const randomAlphanumeric = (length: number, random: RandomSource): string => randomFrom(ALPHANUMERIC, length, random);

export type NonEmpty<T> = readonly [T, ...T[]];

export type AtLeastTwo<T> = readonly [T, T, ...T[]];

const itemAt = <T>(items: NonEmpty<T>, index: number): T => items.reduce((chosen, item, position) => (position === index ? item : chosen), items[0]);

export const pick = <T>(items: NonEmpty<T>, random: RandomSource): T => itemAt(items, random.nextInt(items.length));

export const pickTwoDistinct = <T>(items: AtLeastTwo<T>, random: RandomSource): readonly [T, T] => {
  const first = random.nextInt(items.length);
  const second = (first + 1 + random.nextInt(items.length - 1)) % items.length;
  return [itemAt(items, first), itemAt(items, second)];
};

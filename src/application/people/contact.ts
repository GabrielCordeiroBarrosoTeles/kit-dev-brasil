import { randomDigits, randomFrom } from '../../domain/shared/random';
import type { RandomSource } from '../../domain/shared/types';

export const mobileNumber = (areaCode: string, random: RandomSource, formatted: boolean): string => {
  const subscriber = `9${randomFrom('6789', 1, random)}${randomDigits(7, random)}`;
  return formatted ? `(${areaCode}) ${subscriber.slice(0, 5)}-${subscriber.slice(5)}` : `${areaCode}${subscriber}`;
};

export const landlineNumber = (areaCode: string, random: RandomSource, formatted: boolean): string => {
  const subscriber = `${randomFrom('2345', 1, random)}${randomDigits(7, random)}`;
  return formatted ? `(${areaCode}) ${subscriber.slice(0, 4)}-${subscriber.slice(4)}` : `${areaCode}${subscriber}`;
};

import { pick } from '../shared/random';
import type { RandomSource } from '../shared/types';
import type { PostalRange, State } from './types';

export const toPostalCode = (value: number): string => String(value).padStart(8, '0');

export const randomPostalCodeIn = ({ from, to }: PostalRange, random: RandomSource): string => toPostalCode(from + random.nextInt(to - from + 1));

export const randomPostalCodeOf = (state: State, random: RandomSource): string => randomPostalCodeIn(pick(state.postalRanges, random), random);

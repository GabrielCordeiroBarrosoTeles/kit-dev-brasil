import { describe, expect, it } from 'vitest';
import { cyclicWeightsFromRight, descendingWeights, mod11CheckDigit } from '../../../src/domain/shared/checkDigit';
import { randomAlphanumeric, randomDigits, randomFrom } from '../../../src/domain/shared/random';
import { fail, ok } from '../../../src/domain/shared/Result';
import { sequenceRandom } from '../../fakes/random';

describe('mod11CheckDigit', () => {
  it('returns zero when the remainder is below two and eleven minus it otherwise', () => {
    expect(mod11CheckDigit([0], descendingWeights)).toBe(0);
    expect(mod11CheckDigit([5], () => 2)).toBe(1);
    expect(mod11CheckDigit([1], () => 1)).toBe(0);
    expect(mod11CheckDigit([2], () => 1)).toBe(9);
  });

  it('builds descending and cyclic weights', () => {
    expect([0, 1, 2].map((index) => descendingWeights(index, 3))).toEqual([4, 3, 2]);
    const weights = cyclicWeightsFromRight(2, 9);
    expect(Array.from({ length: 10 }, (_, index) => weights(index, 10))).toEqual([3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  });
});

describe('random helpers', () => {
  it('picks characters from the alphabet', () => {
    expect(randomFrom('ab', 3, sequenceRandom([1, 0, 1]))).toBe('bab');
    expect(randomDigits(4, sequenceRandom([1, 2, 3, 13]))).toBe('1233');
    expect(randomAlphanumeric(2, sequenceRandom([10, 35]))).toBe('AZ');
  });
});

describe('Result', () => {
  it('wraps values and errors', () => {
    expect(ok(1)).toEqual({ ok: true, value: 1 });
    expect(fail('x')).toEqual({ ok: false, error: 'x' });
  });
});

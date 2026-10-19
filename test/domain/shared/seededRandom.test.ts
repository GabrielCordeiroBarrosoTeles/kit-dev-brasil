import { describe, expect, it } from 'vitest';
import { SeededRandom, seedFromText } from '../../../src/domain/shared/seededRandom';

const draw = (random: SeededRandom, count: number, max = 1000) => Array.from({ length: count }, () => random.nextInt(max));

describe('seeded random', () => {
  it('hashes text into a stable 32-bit seed', () => {
    expect(seedFromText('')).toBe(0x811c9dc5);
    expect(seedFromText('42')).toBe(seedFromText('42'));
    expect(seedFromText('42')).not.toBe(seedFromText('43'));
    expect(seedFromText('cadastro-clientes')).toBeLessThan(2 ** 32);
  });

  it('repeats the same sequence for the same seed and stays in range', () => {
    expect(draw(new SeededRandom(7), 50)).toEqual(draw(new SeededRandom(7), 50));
    expect(draw(new SeededRandom(7), 50)).not.toEqual(draw(new SeededRandom(8), 50));
    const values = draw(new SeededRandom(-3), 5000, 10);
    expect(Math.min(...values)).toBe(0);
    expect(Math.max(...values)).toBe(9);
  });
});

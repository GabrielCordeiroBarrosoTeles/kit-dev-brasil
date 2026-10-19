import { describe, expect, it } from 'vitest';
import { CITIES, CITIES_BY_STATE, cityByPostalCode } from '../../../src/domain/brazil/cities';
import { randomPostalCodeIn, randomPostalCodeOf, toPostalCode } from '../../../src/domain/brazil/postalCode';
import { inRange, isStateCode, stateByCode, stateByPostalCode, STATES } from '../../../src/domain/brazil/states';
import { lcgRandom, sequenceRandom } from '../../fakes/random';

const ranges = STATES.flatMap((state) => state.postalRanges.map((range) => ({ state: state.code, ...range }))).sort((a, b) => a.from - b.from);

describe('states', () => {
  it('lists the 27 federative units with unique codes, electoral codes and area codes', () => {
    expect(STATES).toHaveLength(27);
    expect(new Set(STATES.map((state) => state.code)).size).toBe(27);
    expect(STATES.map((state) => state.electoralCode).sort((a, b) => a - b)).toEqual(Array.from({ length: 27 }, (_, index) => index + 1));
    const areaCodes = STATES.flatMap((state) => state.areaCodes);
    expect(new Set(areaCodes).size).toBe(areaCodes.length);
    expect(areaCodes).toHaveLength(67);
  });

  it('keeps postal ranges inside 01000-000 and 99999-999 without overlaps', () => {
    expect(ranges[0]?.from).toBe(1_000_000);
    expect(ranges.at(-1)?.to).toBe(99_999_999);
    ranges.slice(1).forEach((range, index) => expect(range.from, range.state).toBeGreaterThan(ranges[index]?.to ?? 0));
  });

  it('finds states by code and by postal code', () => {
    expect(isStateCode('SP')).toBe(true);
    expect(isStateCode('XX')).toBe(false);
    expect(isStateCode(35)).toBe(false);
    expect(stateByCode('CE').name).toBe('Ceará');
    expect(stateByPostalCode(60_160_230)?.code).toBe('CE');
    expect(stateByPostalCode(73_000_000)?.code).toBe('DF');
    expect(stateByPostalCode(72_800_000)?.code).toBe('GO');
    expect(stateByPostalCode(999)).toBeUndefined();
    expect(inRange(5, { from: 5, to: 5 })).toBe(true);
  });
});

describe('cities', () => {
  it('has cities for every state, inside the state postal ranges and with its area codes', () => {
    expect(Object.keys(CITIES_BY_STATE).sort()).toEqual(STATES.map((state) => state.code).sort());
    for (const city of CITIES) {
      const state = stateByCode(city.state);
      expect(state.areaCodes, city.name).toContain(city.areaCode);
      expect(stateByPostalCode(city.postalRange.from)?.code, city.name).toBe(city.state);
      expect(stateByPostalCode(city.postalRange.to)?.code, city.name).toBe(city.state);
    }
  });

  it('never overlaps two cities', () => {
    const sorted = [...CITIES].sort((a, b) => a.postalRange.from - b.postalRange.from);
    sorted.slice(1).forEach((city, index) => expect(city.postalRange.from, city.name).toBeGreaterThan(sorted[index]?.postalRange.to ?? 0));
  });

  it('finds the city of a postal code', () => {
    expect(cityByPostalCode(1_310_100)?.name).toBe('São Paulo');
    expect(cityByPostalCode(20_040_020)?.name).toBe('Rio de Janeiro');
    expect(cityByPostalCode(999)).toBeUndefined();
  });
});

describe('postal codes', () => {
  it('pads and draws inside a range', () => {
    expect(toPostalCode(1_310_100)).toBe('01310100');
    expect(randomPostalCodeIn({ from: 1000, to: 1009 }, sequenceRandom([7]))).toBe('00001007');
    const random = lcgRandom(3);
    for (const state of STATES) {
      expect(stateByPostalCode(Number(randomPostalCodeOf(state, random)))?.code).toBe(state.code);
    }
  });
});

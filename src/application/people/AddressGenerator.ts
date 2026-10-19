import { CITIES_BY_STATE } from '../../domain/brazil/cities';
import { NEIGHBORHOODS, STREET_NAMES, STREET_TYPES } from '../../domain/brazil/names';
import { randomPostalCodeIn } from '../../domain/brazil/postalCode';
import { STATES } from '../../domain/brazil/states';
import type { City, StateCode } from '../../domain/brazil/types';
import { pick } from '../../domain/shared/random';
import type { RandomSource } from '../../domain/shared/types';
import type { Address } from './types';

const COMPLEMENT_CHANCE = 3;

export interface LocatedAddress {
  readonly address: Address;
  readonly city: City;
}

export class AddressGenerator {
  constructor(private readonly random: RandomSource) {}

  generate(state: StateCode | undefined, formatted: boolean): LocatedAddress {
    const city = pick(CITIES_BY_STATE[state ?? pick(STATES, this.random).code], this.random);
    const postalCode = randomPostalCodeIn(city.postalRange, this.random);
    const hasComplement = this.random.nextInt(COMPLEMENT_CHANCE) === 0;
    return {
      city,
      address: {
        street: `${pick(STREET_TYPES, this.random)} ${pick(STREET_NAMES, this.random)}`,
        number: String(this.random.nextInt(2999) + 1),
        complement: hasComplement ? `Apto ${this.random.nextInt(20) + 1}0${this.random.nextInt(4) + 1}` : undefined,
        neighborhood: pick(NEIGHBORHOODS, this.random),
        city: city.name,
        state: city.state,
        postalCode: formatted ? `${postalCode.slice(0, 5)}-${postalCode.slice(5)}` : postalCode,
      },
    };
  }
}

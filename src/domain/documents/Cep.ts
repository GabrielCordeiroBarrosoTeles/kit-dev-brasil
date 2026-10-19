import { cityByPostalCode } from '../brazil/cities';
import { randomPostalCodeOf } from '../brazil/postalCode';
import { stateByCode, stateByPostalCode, STATES } from '../brazil/states';
import type { StateCode } from '../brazil/types';
import { pick } from '../shared/random';
import type { RandomSource } from '../shared/types';
import type { DocumentType, DocumentValidation } from './types';
import { invalid, VALID } from './validation';

const LENGTH = 8;
const ALLOWED = /^[\d.\-\s]*$/;
const IDENTIFIABLE = /^\d{5}-\d{3}$/;

export class Cep implements DocumentType {
  readonly kind = 'cep';
  readonly label = 'CEP';

  normalize(text: string): string {
    return text.replace(/\D/g, '');
  }

  identifies(text: string): boolean {
    return IDENTIFIABLE.test(text.trim());
  }

  accepts(text: string): boolean {
    return ALLOWED.test(text) && this.normalize(text).length === LENGTH;
  }

  details(text: string): string | undefined {
    const postalCode = Number(this.normalize(text));
    const city = cityByPostalCode(postalCode);
    if (city) {
      return `${city.name} · ${city.state}`;
    }
    const state = stateByPostalCode(postalCode);
    return state && `${state.name} · ${state.code}`;
  }

  validate(text: string): DocumentValidation {
    if (!ALLOWED.test(text)) {
      return invalid({ code: 'invalid-characters' });
    }
    const digits = this.normalize(text);
    if (digits.length !== LENGTH) {
      return invalid({ code: 'wrong-length', expected: LENGTH, actual: digits.length });
    }
    return stateByPostalCode(Number(digits)) ? VALID : invalid({ code: 'unknown-range' });
  }

  format(text: string): string {
    const digits = this.normalize(text);
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }

  generate(random: RandomSource): string {
    return randomPostalCodeOf(pick(STATES, random), random);
  }

  generateFor(state: StateCode, random: RandomSource): string {
    return randomPostalCodeOf(stateByCode(state), random);
  }
}

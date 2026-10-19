import { cyclicWeightsFromRight, mod11CheckDigit } from '../shared/checkDigit';
import { randomAlphanumeric, randomDigits } from '../shared/random';
import type { RandomSource } from '../shared/types';
import type { DocumentType, DocumentValidation } from './types';
import { invalid, isRepeated, VALID } from './validation';

const LENGTH = 14;
const BASE_LENGTH = 12;
const ROOT_LENGTH = 8;
const HEADQUARTERS_BRANCH = '0001';
const ALLOWED = /^[0-9A-Za-z.\-/\s]*$/;
const SHAPE = /^[0-9A-Z]{12}\d{2}$/;
const IDENTIFIABLE = /^(?:\d{14}|[0-9A-Z]{2}\.[0-9A-Z]{3}\.[0-9A-Z]{3}\/[0-9A-Z]{4}-\d{2})$/;
const ASCII_ZERO = 48;
const WEIGHTS = cyclicWeightsFromRight(2, 9);

export class Cnpj implements DocumentType {
  readonly kind = 'cnpj';
  readonly label = 'CNPJ';

  normalize(text: string): string {
    return text.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
  }

  identifies(text: string): boolean {
    return IDENTIFIABLE.test(text.trim());
  }

  validate(text: string): DocumentValidation {
    if (!ALLOWED.test(text)) {
      return invalid({ code: 'invalid-characters' });
    }
    const value = this.normalize(text);
    if (value.length !== LENGTH) {
      return invalid({ code: 'wrong-length', expected: LENGTH, actual: value.length });
    }
    if (!SHAPE.test(value)) {
      return invalid({ code: 'invalid-characters' });
    }
    if (isRepeated(value)) {
      return invalid({ code: 'repeated-characters' });
    }
    const expected = this.checkDigits(value.slice(0, BASE_LENGTH));
    const actual = value.slice(BASE_LENGTH);
    return expected === actual ? VALID : invalid({ code: 'invalid-check-digits', expected, actual });
  }

  format(text: string): string {
    const value = this.normalize(text);
    return `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5, 8)}/${value.slice(8, 12)}-${value.slice(12, 14)}`;
  }

  generate(random: RandomSource): string {
    return this.withCheckDigits(randomDigits(ROOT_LENGTH, random) + HEADQUARTERS_BRANCH);
  }

  generateAlphanumeric(random: RandomSource): string {
    return this.withCheckDigits(randomAlphanumeric(ROOT_LENGTH, random) + HEADQUARTERS_BRANCH);
  }

  private withCheckDigits(base: string): string {
    return base + this.checkDigits(base);
  }

  private checkDigits(base: string): string {
    const values = [...base].map((character) => character.charCodeAt(0) - ASCII_ZERO);
    const first = mod11CheckDigit(values, WEIGHTS);
    const second = mod11CheckDigit([...values, first], WEIGHTS);
    return `${first}${second}`;
  }
}

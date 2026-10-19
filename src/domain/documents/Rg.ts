import { ascendingWeights, toDigits, weightedSum } from '../shared/checkDigit';
import { randomDigits } from '../shared/random';
import type { RandomSource } from '../shared/types';
import type { DocumentType, DocumentValidation } from './types';
import { invalid, isRepeated, VALID } from './validation';

const LENGTH = 9;
const BASE_LENGTH = 8;
const ALLOWED = /^[\dXx.\-\s]*$/;
const SHAPE = /^[0-9]{8}[0-9X]$/;
const IDENTIFIABLE = /^\d{2}\.\d{3}\.\d{3}-[\dXx]$/;

export class Rg implements DocumentType {
  readonly kind = 'rg';
  readonly label = 'RG (SP)';

  normalize(text: string): string {
    return text.replace(/[^0-9Xx]/g, '').toUpperCase();
  }

  identifies(text: string): boolean {
    return IDENTIFIABLE.test(text.trim());
  }

  accepts(text: string): boolean {
    return ALLOWED.test(text) && SHAPE.test(this.normalize(text));
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
    const expected = this.checkDigit(value.slice(0, BASE_LENGTH));
    const actual = value.slice(BASE_LENGTH);
    return expected === actual ? VALID : invalid({ code: 'invalid-check-digits', expected, actual });
  }

  format(text: string): string {
    const value = this.normalize(text);
    return `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5, 8)}-${value.slice(8, 9)}`;
  }

  generate(random: RandomSource): string {
    let base = randomDigits(BASE_LENGTH, random);
    while (isRepeated(base)) {
      base = randomDigits(BASE_LENGTH, random);
    }
    return base + this.checkDigit(base);
  }

  private checkDigit(base: string): string {
    const digit = 11 - (weightedSum(toDigits(base), ascendingWeights(2)) % 11);
    if (digit === 10) {
      return 'X';
    }
    return digit === 11 ? '0' : String(digit);
  }
}

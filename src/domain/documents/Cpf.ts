import { descendingWeights, mod11CheckDigit } from '../shared/checkDigit';
import { randomDigits } from '../shared/random';
import type { RandomSource } from '../shared/types';
import type { DocumentType, DocumentValidation } from './types';
import { invalid, isRepeated, VALID } from './validation';

const LENGTH = 11;
const BASE_LENGTH = 9;
const ALLOWED = /^[\d.\-\s]*$/;
const IDENTIFIABLE = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;

export class Cpf implements DocumentType {
  readonly kind = 'cpf';
  readonly label = 'CPF';

  normalize(text: string): string {
    return text.replace(/\D/g, '');
  }

  identifies(text: string): boolean {
    return IDENTIFIABLE.test(text.trim());
  }

  validate(text: string): DocumentValidation {
    if (!ALLOWED.test(text)) {
      return invalid({ code: 'invalid-characters' });
    }
    const digits = this.normalize(text);
    if (digits.length !== LENGTH) {
      return invalid({ code: 'wrong-length', expected: LENGTH, actual: digits.length });
    }
    if (isRepeated(digits)) {
      return invalid({ code: 'repeated-characters' });
    }
    const expected = this.checkDigits(digits.slice(0, BASE_LENGTH));
    const actual = digits.slice(BASE_LENGTH);
    return expected === actual ? VALID : invalid({ code: 'invalid-check-digits', expected, actual });
  }

  format(text: string): string {
    const digits = this.normalize(text);
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  }

  generate(random: RandomSource): string {
    let base = randomDigits(BASE_LENGTH, random);
    while (isRepeated(base)) {
      base = randomDigits(BASE_LENGTH, random);
    }
    return base + this.checkDigits(base);
  }

  private checkDigits(base: string): string {
    const values = [...base].map(Number);
    const first = mod11CheckDigit(values, descendingWeights);
    const second = mod11CheckDigit([...values, first], descendingWeights);
    return `${first}${second}`;
  }
}

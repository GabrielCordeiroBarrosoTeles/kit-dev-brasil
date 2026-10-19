import { randomDigits, randomFrom } from '../shared/random';
import type { RandomSource } from '../shared/types';
import type { DocumentType, DocumentValidation } from './types';
import { invalid, VALID } from './validation';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const MERCOSUL_LETTERS = 'ABCDEFGHIJ';
const OLD = /^[A-Z]{3}\d{4}$/;
const MERCOSUL = /^[A-Z]{3}\d[A-Z]\d{2}$/;
const ALLOWED = /^[A-Za-z0-9\-\s]*$/;
const IDENTIFIABLE = /^(?:[A-Z]{3}-\d{4}|[A-Z]{3}\d[A-Z]\d{2})$/;
const EXPECTED = 'ABC-1234 (antiga) ou ABC1D23 (Mercosul)';

export class LicensePlate implements DocumentType {
  readonly kind = 'license-plate';
  readonly label = 'Placa';

  normalize(text: string): string {
    return text.replace(/[\s-]/g, '').toUpperCase();
  }

  identifies(text: string): boolean {
    return IDENTIFIABLE.test(text.trim());
  }

  accepts(text: string): boolean {
    return ALLOWED.test(text) && this.isPlate(this.normalize(text));
  }

  details(text: string): string {
    if (!MERCOSUL.test(this.normalize(text))) {
      return `antiga, equivale à Mercosul ${this.toMercosul(text)}`;
    }
    const old = this.toOld(text);
    return old === undefined ? 'Mercosul' : `Mercosul, equivale à antiga ${old}`;
  }

  validate(text: string): DocumentValidation {
    return this.accepts(text) ? VALID : invalid({ code: 'invalid-format', expected: EXPECTED });
  }

  format(text: string): string {
    const value = this.normalize(text);
    return OLD.test(value) ? `${value.slice(0, 3)}-${value.slice(3)}` : value;
  }

  generate(random: RandomSource): string {
    return `${randomFrom(LETTERS, 3, random)}${randomDigits(1, random)}${randomFrom(LETTERS, 1, random)}${randomDigits(2, random)}`;
  }

  generateOld(random: RandomSource): string {
    return `${randomFrom(LETTERS, 3, random)}${randomDigits(4, random)}`;
  }

  toMercosul(text: string): string {
    const value = this.normalize(text);
    return `${value.slice(0, 4)}${MERCOSUL_LETTERS.charAt(Number(value.charAt(4)))}${value.slice(5)}`;
  }

  toOld(text: string): string | undefined {
    const value = this.normalize(text);
    const digit = MERCOSUL_LETTERS.indexOf(value.charAt(4));
    return digit < 0 ? undefined : this.format(`${value.slice(0, 4)}${digit}${value.slice(5)}`);
  }

  private isPlate(value: string): boolean {
    return OLD.test(value) || MERCOSUL.test(value);
  }
}

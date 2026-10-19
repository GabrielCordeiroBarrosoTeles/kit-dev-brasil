import { randomDigits } from '../shared/random';
import type { RandomSource } from '../shared/types';
import type { DocumentKind, DocumentType, DocumentValidation } from './types';
import { invalid, isRepeated, VALID } from './validation';

const NUMERIC_ALLOWED = /^[\d.\-\s/]*$/;

export abstract class NumericDocument implements DocumentType {
  abstract readonly kind: DocumentKind;
  abstract readonly label: string;
  protected abstract readonly length: number;
  protected abstract readonly baseLength: number;
  protected readonly shape: RegExp | undefined = undefined;

  normalize(text: string): string {
    return text.replace(/\D/g, '');
  }

  identifies(text: string): boolean {
    return this.shape !== undefined && this.shape.test(text.trim());
  }

  accepts(text: string): boolean {
    return NUMERIC_ALLOWED.test(text) && this.normalize(text).length === this.length;
  }

  validate(text: string): DocumentValidation {
    if (!NUMERIC_ALLOWED.test(text)) {
      return invalid({ code: 'invalid-characters' });
    }
    const digits = this.normalize(text);
    if (digits.length !== this.length) {
      return invalid({ code: 'wrong-length', expected: this.length, actual: digits.length });
    }
    if (isRepeated(digits)) {
      return invalid({ code: 'repeated-characters' });
    }
    return this.verify(digits);
  }

  format(text: string): string {
    return this.normalize(text);
  }

  generate(random: RandomSource): string {
    return this.generateFrom(() => this.randomBase(random));
  }

  protected generateFrom(nextBase: () => string): string {
    let base = nextBase();
    while (!this.canGenerateFrom(base)) {
      base = nextBase();
    }
    return base + this.checkDigits(base);
  }

  protected verify(digits: string): DocumentValidation {
    const base = digits.slice(0, this.baseLength);
    const actual = digits.slice(this.baseLength);
    return this.acceptedCheckDigits(base).includes(actual) ? VALID : invalid({ code: 'invalid-check-digits', expected: this.checkDigits(base), actual });
  }

  protected acceptedCheckDigits(base: string): readonly string[] {
    return [this.checkDigits(base)];
  }

  protected randomBase(random: RandomSource): string {
    return randomDigits(this.baseLength, random);
  }

  protected canGenerateFrom(base: string): boolean {
    return !isRepeated(base) && new Set(this.acceptedCheckDigits(base)).size === 1;
  }

  protected abstract checkDigits(base: string): string;
}

import { cyclicWeightsFromRight, mod11CheckDigit, toDigits } from '../shared/checkDigit';
import { NumericDocument } from './NumericDocument';

const WEIGHTS = cyclicWeightsFromRight(2, 9);

export class Pis extends NumericDocument {
  readonly kind = 'pis';
  readonly label = 'PIS/PASEP';
  protected readonly length = 11;
  protected readonly baseLength = 10;
  protected override readonly shape = /^\d{3}\.\d{5}\.\d{2}-\d$/;

  override format(text: string): string {
    const digits = this.normalize(text);
    return `${digits.slice(0, 3)}.${digits.slice(3, 8)}.${digits.slice(8, 10)}-${digits.slice(10, 11)}`;
  }

  protected checkDigits(base: string): string {
    return String(mod11CheckDigit(toDigits(base), WEIGHTS));
  }
}

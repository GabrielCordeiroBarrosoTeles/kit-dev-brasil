import { cyclicWeightsFromRight, toDigits, weightedSum } from '../shared/checkDigit';
import { NumericDocument } from './NumericDocument';

const WEIGHTS = cyclicWeightsFromRight(2, 9);

export class Renavam extends NumericDocument {
  readonly kind = 'renavam';
  readonly label = 'RENAVAM';
  protected readonly length = 11;
  protected readonly baseLength = 10;

  protected checkDigits(base: string): string {
    const remainder = (weightedSum(toDigits(base), WEIGHTS) * 10) % 11;
    return String(remainder === 10 ? 0 : remainder);
  }
}

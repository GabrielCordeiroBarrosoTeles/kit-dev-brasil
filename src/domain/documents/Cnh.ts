import { ascendingWeights, mod11CheckDigit, toDigits, weightedSum } from '../shared/checkDigit';
import { NumericDocument } from './NumericDocument';

const secondDigitWeight = (index: number): number => (index === 9 ? 2 : index + 3);

const remainderOf = (values: readonly number[], firstWeight: number): number => weightedSum(values, ascendingWeights(firstWeight)) % 11;

export class Cnh extends NumericDocument {
  readonly kind = 'cnh';
  readonly label = 'CNH';
  protected readonly length = 11;
  protected readonly baseLength = 9;

  protected checkDigits(base: string): string {
    const values = toDigits(base);
    const first = mod11CheckDigit(values, ascendingWeights(2));
    const second = mod11CheckDigit([...values, first], secondDigitWeight);
    return `${first}${second}`;
  }

  protected override acceptedCheckDigits(base: string): readonly string[] {
    return [this.checkDigits(base), this.denatranCheckDigits(base)];
  }

  private denatranCheckDigits(base: string): string {
    const values = toDigits(base);
    const descending = (11 - remainderOf(values, 2)) % 11;
    const overflow = descending >= 10;
    const first = overflow ? 0 : descending;
    const ascending = remainderOf(values, 1);
    const adjusted = ascending >= 10 ? 0 : ascending - (overflow ? 2 : 0);
    const second = adjusted < 0 ? adjusted + 11 : adjusted;
    return `${first}${second >= 10 ? 0 : second}`;
  }
}

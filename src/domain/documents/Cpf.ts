import { descendingWeights, mod11CheckDigit, toDigits } from '../shared/checkDigit';
import { NumericDocument } from './NumericDocument';

export class Cpf extends NumericDocument {
  readonly kind = 'cpf';
  readonly label = 'CPF';
  protected readonly length = 11;
  protected readonly baseLength = 9;
  protected override readonly shape = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;

  override format(text: string): string {
    const digits = this.normalize(text);
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  }

  protected checkDigits(base: string): string {
    const values = toDigits(base);
    const first = mod11CheckDigit(values, descendingWeights);
    const second = mod11CheckDigit([...values, first], descendingWeights);
    return `${first}${second}`;
  }
}

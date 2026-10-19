import { toDigits, weightedSum } from '../shared/checkDigit';
import { randomDigits } from '../shared/random';
import type { RandomSource } from '../shared/types';
import { NumericDocument } from './NumericDocument';
import type { DocumentValidation } from './types';
import { invalid, VALID } from './validation';

const LENGTH = 15;
const PIS_LENGTH = 11;
const VALID_PREFIXES = new Set(['1', '2', '7', '8', '9']);
const weightedTotal = (digits: string): number => weightedSum(toDigits(digits), (index) => LENGTH - index);

export class Cns extends NumericDocument {
  readonly kind = 'cns';
  readonly label = 'CNS';
  protected readonly length = LENGTH;
  protected readonly baseLength = PIS_LENGTH;
  protected override readonly shape = /^\d{3} \d{4} \d{4} \d{4}$/;

  override format(text: string): string {
    const digits = this.normalize(text);
    return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7, 11)} ${digits.slice(11, 15)}`;
  }

  override generate(random: RandomSource): string {
    const prefix = random.nextInt(2) === 0 ? '1' : '2';
    const pis = prefix + randomDigits(PIS_LENGTH - 1, random);
    return pis + this.checkDigits(pis);
  }

  protected override verify(digits: string): DocumentValidation {
    if (!VALID_PREFIXES.has(digits.charAt(0))) {
      return invalid({ code: 'invalid-prefix' });
    }
    return weightedTotal(digits) % 11 === 0 ? VALID : invalid({ code: 'invalid-checksum' });
  }

  protected checkDigits(pis: string): string {
    const total = weightedTotal(pis);
    const digit = (11 - (total % 11)) % 11;
    if (digit !== 10) {
      return `000${digit}`;
    }
    return `001${(11 - ((total + 2) % 11)) % 11}`;
  }
}

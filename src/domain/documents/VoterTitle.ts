import { ascendingWeights, toDigits, weightedSum } from '../shared/checkDigit';
import { randomDigits } from '../shared/random';
import type { RandomSource } from '../shared/types';
import { NumericDocument } from './NumericDocument';
import type { DocumentValidation } from './types';
import { invalid } from './validation';

const SEQUENCE_LENGTH = 8;
const STATE_CODES = 28;
const SPECIAL_RULE_STATES = new Set(['01', '02']);

const digitFrom = (remainder: number): number => (remainder === 10 ? 0 : remainder);

export class VoterTitle extends NumericDocument {
  readonly kind = 'voter-title';
  readonly label = 'Título de eleitor';
  protected readonly length = 12;
  protected readonly baseLength = 10;
  protected override readonly shape = /^\d{4} \d{4} \d{4}$/;

  override format(text: string): string {
    const digits = this.normalize(text);
    return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)}`;
  }

  generateFor(stateCode: number, random: RandomSource): string {
    const state = String(stateCode).padStart(2, '0');
    return this.generateFrom(() => randomDigits(SEQUENCE_LENGTH, random) + state);
  }

  protected override verify(digits: string): DocumentValidation {
    const state = Number(digits.slice(SEQUENCE_LENGTH, this.baseLength));
    return state >= 1 && state <= STATE_CODES ? super.verify(digits) : invalid({ code: 'invalid-format', expected: 'UF entre 01 e 28 nas posições 9 e 10' });
  }

  protected override randomBase(random: RandomSource): string {
    return randomDigits(SEQUENCE_LENGTH, random) + String(random.nextInt(STATE_CODES) + 1).padStart(2, '0');
  }

  protected checkDigits(base: string): string {
    return this.digits(base, false);
  }

  protected override acceptedCheckDigits(base: string): readonly string[] {
    return [this.digits(base, false), this.digits(base, true)];
  }

  private digits(base: string, electoralCourtRule: boolean): string {
    const values = toDigits(base);
    const special = electoralCourtRule && SPECIAL_RULE_STATES.has(base.slice(SEQUENCE_LENGTH));
    const adjust = (remainder: number): number => (special && remainder === 0 ? 1 : digitFrom(remainder));
    const first = adjust(weightedSum(values.slice(0, SEQUENCE_LENGTH), ascendingWeights(2)) % 11);
    const second = adjust(weightedSum([...values.slice(SEQUENCE_LENGTH), first], ascendingWeights(7)) % 11);
    return `${first}${second}`;
  }
}

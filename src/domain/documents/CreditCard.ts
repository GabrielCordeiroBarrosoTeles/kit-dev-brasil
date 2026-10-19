import { luhnCheckDigit } from '../shared/checkDigit';
import { pick, randomDigits } from '../shared/random';
import type { NonEmpty } from '../shared/random';
import type { RandomSource } from '../shared/types';
import type { DocumentType, DocumentValidation } from './types';
import { invalid, isRepeated, VALID } from './validation';

export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'elo' | 'hipercard' | 'diners';

interface BrandRule {
  readonly brand: CardBrand;
  readonly label: string;
  readonly length: number;
  readonly prefixes: NonEmpty<string>;
  readonly matches: (digits: string) => boolean;
}

const between = (digits: string, size: number, min: number, max: number): boolean => {
  const value = Number(digits.slice(0, size));
  return digits.length >= size && value >= min && value <= max;
};

const startsWith = (prefixes: readonly string[]) => (digits: string) => prefixes.some((prefix) => digits.startsWith(prefix));

const ELO_PREFIXES = ['401178', '401179', '431274', '438935', '451416', '457393', '457631', '457632', '504175', '627780', '636297', '636368'];
const ELO_RANGES: readonly (readonly [number, number])[] = [
  [506699, 506778],
  [509000, 509999],
  [650031, 650051],
  [650405, 650439],
  [650485, 650538],
  [650541, 650598],
  [650700, 650727],
  [650901, 650920],
  [651652, 651679],
  [655000, 655058],
];

const RULES: Readonly<Record<CardBrand, BrandRule>> = {
  elo: {
    brand: 'elo',
    label: 'Elo',
    length: 16,
    prefixes: ['636368', '438935', '504175', '451416', '509000'],
    matches: (digits) => startsWith(ELO_PREFIXES)(digits) || ELO_RANGES.some(([min, max]) => between(digits, 6, min, max)),
  },
  hipercard: { brand: 'hipercard', label: 'Hipercard', length: 16, prefixes: ['606282'], matches: startsWith(['606282', '3841']) },
  amex: { brand: 'amex', label: 'American Express', length: 15, prefixes: ['34', '37'], matches: startsWith(['34', '37']) },
  diners: {
    brand: 'diners',
    label: 'Diners Club',
    length: 14,
    prefixes: ['36', '38'],
    matches: (digits) => startsWith(['36', '38'])(digits) || between(digits, 3, 300, 305),
  },
  visa: { brand: 'visa', label: 'Visa', length: 16, prefixes: ['4'], matches: startsWith(['4']) },
  mastercard: {
    brand: 'mastercard',
    label: 'Mastercard',
    length: 16,
    prefixes: ['51', '52', '53', '54', '55', '2221', '2720'],
    matches: (digits) => between(digits, 2, 51, 55) || between(digits, 4, 2221, 2720),
  },
};

const DETECTION_ORDER: readonly CardBrand[] = ['elo', 'hipercard', 'amex', 'diners', 'visa', 'mastercard'];

const MIN_LENGTH = 13;
const MAX_LENGTH = 19;
const ALLOWED = /^[\d\s-]*$/;
const IDENTIFIABLE = /^(?:\d{4}[ -]\d{4}[ -]\d{4}[ -]\d{4}|\d{4}[ -]\d{6}[ -]\d{4,5})$/;

export class CreditCard implements DocumentType {
  readonly kind = 'credit-card';
  readonly label = 'Cartão';

  normalize(text: string): string {
    return text.replace(/\D/g, '');
  }

  identifies(text: string): boolean {
    return IDENTIFIABLE.test(text.trim());
  }

  accepts(text: string): boolean {
    const length = this.normalize(text).length;
    return ALLOWED.test(text) && length >= MIN_LENGTH && length <= MAX_LENGTH;
  }

  details(text: string): string | undefined {
    return this.brandOf(this.normalize(text))?.label;
  }

  validate(text: string): DocumentValidation {
    if (!ALLOWED.test(text)) {
      return invalid({ code: 'invalid-characters' });
    }
    const digits = this.normalize(text);
    if (digits.length < MIN_LENGTH || digits.length > MAX_LENGTH) {
      return invalid({ code: 'invalid-format', expected: `entre ${MIN_LENGTH} e ${MAX_LENGTH} dígitos` });
    }
    if (isRepeated(digits)) {
      return invalid({ code: 'repeated-characters' });
    }
    const expected = String(luhnCheckDigit(digits.slice(0, -1)));
    const actual = digits.slice(-1);
    return expected === actual ? VALID : invalid({ code: 'invalid-check-digits', expected, actual });
  }

  format(text: string): string {
    const digits = this.normalize(text);
    const groups = digits.length === 15 || digits.length === 14 ? [4, 6, 5] : [4, 4, 4, 4, 3];
    const parts: string[] = [];
    let position = 0;
    for (const size of groups) {
      if (position < digits.length) {
        parts.push(digits.slice(position, position + size));
        position += size;
      }
    }
    return parts.join(' ');
  }

  generate(random: RandomSource): string {
    return this.generateFor('visa', random);
  }

  generateFor(brand: CardBrand, random: RandomSource): string {
    const rule = RULES[brand];
    const prefix = pick(rule.prefixes, random);
    const payload = prefix + randomDigits(rule.length - prefix.length - 1, random);
    return payload + luhnCheckDigit(payload);
  }

  private brandOf(digits: string): BrandRule | undefined {
    const brand = DETECTION_ORDER.find((candidate) => RULES[candidate].matches(digits));
    return brand === undefined ? undefined : RULES[brand];
  }
}

import { cyclicWeightsFromRight, mod11CheckDigit, toDigits, weightedSum } from '../shared/checkDigit';

const MOD11_WEIGHTS = cyclicWeightsFromRight(2, 9);

export const modulo10 = (digits: string): string => {
  const sum = toDigits(digits)
    .reverse()
    .reduce((total, digit, index) => {
      const product = digit * (index % 2 === 0 ? 2 : 1);
      return total + (product > 9 ? product - 9 : product);
    }, 0);
  return String((10 - (sum % 10)) % 10);
};

export const bankModulo11 = (digits: string): string => {
  const digit = 11 - (weightedSum(toDigits(digits), MOD11_WEIGHTS) % 11);
  return String(digit >= 10 ? 1 : digit);
};

export const collectionModulo11 = (digits: string): string => String(mod11CheckDigit(toDigits(digits), MOD11_WEIGHTS));

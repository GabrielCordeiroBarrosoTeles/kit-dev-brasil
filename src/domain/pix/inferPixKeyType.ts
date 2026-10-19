import type { PixKeyType } from './types';

const PATTERNS: readonly (readonly [PixKeyType, RegExp])[] = [
  ['email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/],
  ['phone', /^\+55\d{10,11}$/],
  ['cpf', /^\d{11}$/],
  ['cnpj', /^[0-9A-Z]{12}\d{2}$/],
  ['random', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i],
];

export const inferPixKeyType = (key: string): PixKeyType | undefined => PATTERNS.find(([, pattern]) => pattern.test(key))?.[0];

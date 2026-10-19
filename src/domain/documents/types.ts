import type { RandomSource } from '../shared/types';

export type DocumentKind = 'cpf' | 'cnpj' | 'cnh' | 'pis' | 'voter-title' | 'renavam' | 'rg' | 'cns' | 'license-plate' | 'credit-card' | 'cep';

export type DocumentIssue =
  | { readonly code: 'invalid-characters' }
  | { readonly code: 'wrong-length'; readonly expected: number; readonly actual: number }
  | { readonly code: 'repeated-characters' }
  | { readonly code: 'invalid-format'; readonly expected: string }
  | { readonly code: 'invalid-prefix' }
  | { readonly code: 'invalid-checksum' }
  | { readonly code: 'unknown-range' }
  | { readonly code: 'invalid-check-digits'; readonly expected: string; readonly actual: string };

export type DocumentValidation = { readonly valid: true } | { readonly valid: false; readonly issue: DocumentIssue };

export interface DocumentType {
  readonly kind: DocumentKind;
  readonly label: string;
  normalize(text: string): string;
  identifies(text: string): boolean;
  accepts(text: string): boolean;
  details?(text: string): string | undefined;
  validate(text: string): DocumentValidation;
  format(text: string): string;
  generate(random: RandomSource): string;
}

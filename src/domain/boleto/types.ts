export type BoletoKind = 'bank' | 'collection';

export type BoletoIssue =
  | { readonly code: 'invalid-characters' }
  | { readonly code: 'invalid-length'; readonly actual: number }
  | { readonly code: 'invalid-field-check-digit'; readonly field: number; readonly expected: string; readonly actual: string }
  | { readonly code: 'invalid-check-digit'; readonly expected: string; readonly actual: string }
  | { readonly code: 'invalid-currency'; readonly actual: string }
  | { readonly code: 'invalid-value-type'; readonly actual: string };

export interface Boleto {
  readonly kind: BoletoKind;
  readonly barcode: string;
  readonly line: string;
  readonly bankCode: string | undefined;
  readonly segment: string | undefined;
  readonly amount: string | undefined;
  readonly amountIsReference: boolean;
  readonly dueDate: string | undefined;
}

export interface BoletoDecoding {
  readonly boleto: Boleto | undefined;
  readonly issues: readonly BoletoIssue[];
}

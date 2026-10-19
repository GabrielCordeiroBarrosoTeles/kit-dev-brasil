export type PixKeyType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';

export type PixInitiation = 'static' | 'dynamic';

export type BrCodeField =
  | 'payload-format'
  | 'merchant-account'
  | 'gui'
  | 'key-or-url'
  | 'mcc'
  | 'currency'
  | 'amount'
  | 'country'
  | 'merchant-name'
  | 'merchant-city'
  | 'crc';

export type BrCodeIssue =
  | { readonly code: 'malformed'; readonly position: number }
  | { readonly code: 'missing-field'; readonly field: BrCodeField }
  | { readonly code: 'unexpected-value'; readonly field: BrCodeField; readonly expected: string; readonly actual: string }
  | { readonly code: 'too-long'; readonly field: BrCodeField; readonly max: number; readonly actual: number }
  | { readonly code: 'invalid-amount'; readonly actual: string }
  | { readonly code: 'invalid-crc'; readonly expected: string; readonly actual: string };

export interface BrCode {
  readonly initiation: PixInitiation | undefined;
  readonly key: string | undefined;
  readonly keyType: PixKeyType | undefined;
  readonly url: string | undefined;
  readonly description: string | undefined;
  readonly amount: string | undefined;
  readonly merchantName: string | undefined;
  readonly merchantCity: string | undefined;
  readonly postalCode: string | undefined;
  readonly txid: string | undefined;
  readonly crc: string | undefined;
}

export interface BrCodeDecoding {
  readonly brCode: BrCode | undefined;
  readonly issues: readonly BrCodeIssue[];
}

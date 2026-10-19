export type TokenKind = 'pix' | 'document';

export interface Token {
  readonly kind: TokenKind;
  readonly text: string;
  readonly start: number;
  readonly end: number;
  readonly masked: boolean;
}

export interface TokenPattern {
  readonly kind: TokenKind;
  readonly masked: boolean;
  readonly expression: RegExp;
}

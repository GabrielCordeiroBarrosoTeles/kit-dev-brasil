import type { Token, TokenPattern } from './types';

const BOUNDARY_BEFORE = '(?<![0-9A-Za-z])';
const BOUNDARY_AFTER = '(?![0-9A-Za-z])';

const bounded = (body: string): RegExp => new RegExp(`${BOUNDARY_BEFORE}${body}${BOUNDARY_AFTER}`, 'g');

export const DEFAULT_PATTERNS: readonly TokenPattern[] = [
  { kind: 'pix', masked: false, expression: /000201.*?6304[0-9A-Fa-f]{4}/g },
  { kind: 'boleto', masked: true, expression: bounded('\\d{5}\\.\\d{5} \\d{5}\\.\\d{6} \\d{5}\\.\\d{6} \\d \\d{14}') },
  { kind: 'boleto', masked: true, expression: bounded('8\\d{10}-?\\d(?: \\d{11}-?\\d){3}') },
  { kind: 'boleto', masked: false, expression: bounded('\\d{47,48}') },
  { kind: 'document', masked: true, expression: bounded('[0-9A-Z]{2}\\.[0-9A-Z]{3}\\.[0-9A-Z]{3}/[0-9A-Z]{4}-\\d{2}') },
  { kind: 'document', masked: true, expression: bounded('\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}') },
  { kind: 'document', masked: true, expression: bounded('\\d{3}\\.\\d{5}\\.\\d{2}-\\d') },
  { kind: 'document', masked: true, expression: bounded('\\d{2}\\.\\d{3}\\.\\d{3}-[\\dXx]') },
  { kind: 'document', masked: true, expression: bounded('\\d{4}[ -]\\d{4}[ -]\\d{4}[ -]\\d{4}') },
  { kind: 'document', masked: true, expression: bounded('\\d{4}[ -]\\d{6}[ -]\\d{4,5}') },
  { kind: 'document', masked: true, expression: bounded('\\d{3} \\d{4} \\d{4} \\d{4}') },
  { kind: 'document', masked: true, expression: bounded('\\d{4} \\d{4} \\d{4}') },
  { kind: 'document', masked: true, expression: bounded('[A-Z]{3}-\\d{4}|[A-Z]{3}\\d[A-Z]\\d{2}') },
  { kind: 'document', masked: true, expression: bounded('\\d{5}-\\d{3}') },
  { kind: 'document', masked: false, expression: bounded('\\d{14}') },
  { kind: 'document', masked: false, expression: bounded('\\d{11}') },
];

export class TokenScanner {
  constructor(private readonly patterns: readonly TokenPattern[] = DEFAULT_PATTERNS) {}

  findAt(line: string, column: number): Token | undefined {
    for (const pattern of this.patterns) {
      const token = this.matchAt(pattern, line, column);
      if (token) {
        return token;
      }
    }
    return undefined;
  }

  private matchAt({ kind, masked, expression }: TokenPattern, line: string, column: number): Token | undefined {
    for (const match of line.matchAll(new RegExp(expression.source, expression.flags))) {
      const start = match.index;
      const end = start + match[0].length;
      if (column >= start && column <= end) {
        return { kind, masked, text: match[0], start, end };
      }
    }
    return undefined;
  }
}

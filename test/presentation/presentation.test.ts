import { describe, expect, it } from 'vitest';
import type { DocumentInspection } from '../../src/application/inspection/types';
import type { BrCode } from '../../src/domain/pix/types';
import { InspectionRenderer } from '../../src/presentation/InspectionRenderer';
import { bulletList, escapeMarkdown, table } from '../../src/presentation/markdown';
import { describeBrCodeIssue, describeDocumentIssue } from '../../src/presentation/messages';

const renderer = new InspectionRenderer();

const brCode = (overrides: Partial<BrCode> = {}): BrCode => ({
  initiation: undefined,
  key: undefined,
  keyType: undefined,
  url: undefined,
  description: undefined,
  amount: undefined,
  merchantName: undefined,
  merchantCity: undefined,
  postalCode: undefined,
  txid: undefined,
  crc: undefined,
  ...overrides,
});

const document = (overrides: Partial<DocumentInspection> = {}): DocumentInspection => ({
  kind: 'document',
  document: 'cpf',
  label: 'CPF',
  formatted: '529.982.247-25',
  validation: { valid: true },
  ...overrides,
});

describe('markdown helpers', () => {
  it('escapes special characters and builds tables and lists', () => {
    expect(escapeMarkdown('a|b*c_[x](y)')).toBe('a\\|b\\*c\\_\\[x\\]\\(y\\)');
    expect(table([['A', 'B']])).toBe('| Campo | Valor |\n| --- | --- |\n| A | B |');
    expect(bulletList(['x', 'y'])).toBe('- x\n- y');
  });
});

describe('messages', () => {
  it.each([
    [{ code: 'invalid-characters' } as const, 'tem caracteres que não pertencem ao documento'],
    [{ code: 'wrong-length', expected: 11, actual: 9 } as const, 'deveria ter 11 caracteres, mas tem 9'],
    [{ code: 'repeated-characters' } as const, 'todos os caracteres são iguais'],
    [{ code: 'invalid-check-digits', expected: '25', actual: '26' } as const, 'dígitos verificadores errados: esperado 25, encontrado 26'],
  ])('describes document issue %j', (issue, text) => {
    expect(describeDocumentIssue(issue)).toBe(text);
  });

  it.each([
    [{ code: 'malformed', position: 0 } as const, 'estrutura inválida a partir da posição 1'],
    [{ code: 'missing-field', field: 'crc' } as const, 'falta o campo CRC (63)'],
    [{ code: 'unexpected-value', field: 'country', expected: 'BR', actual: 'US' } as const, 'país (58) deveria ser "BR", mas é "US"'],
    [{ code: 'too-long', field: 'merchant-city', max: 15, actual: 16 } as const, 'cidade do recebedor (60) tem 16 caracteres, o máximo é 15'],
    [{ code: 'invalid-amount', actual: '1,0' } as const, 'valor "1,0" fora do formato esperado (ex.: 10.50)'],
    [{ code: 'invalid-crc', expected: '1D3D', actual: '0000' } as const, 'CRC não confere: esperado 1D3D, encontrado 0000'],
  ])('describes PIX issue %j', (issue, text) => {
    expect(describeBrCodeIssue(issue)).toBe(text);
  });
});

describe('InspectionRenderer', () => {
  it('summarizes PIX codes in one line', () => {
    const valid = (overrides: Partial<BrCode>) => renderer.summarizePix({ brCode: brCode(overrides), issues: [] });
    expect(valid({ amount: '25.90', merchantName: 'FULANO' })).toMatch(/^PIX válido: R\$\s25,90 para FULANO$/);
    expect(valid({})).toBe('PIX válido: valor livre');
    expect(renderer.summarizePix({ brCode: undefined, issues: [] })).toBe('PIX válido: valor livre');
    expect(renderer.summarizePix({ brCode: undefined, issues: [{ code: 'malformed', position: 0 }] })).toBe('PIX inválido: estrutura inválida a partir da posição 1');
    const issues = [{ code: 'missing-field', field: 'crc' }, { code: 'missing-field', field: 'mcc' }, { code: 'missing-field', field: 'country' }] as const;
    expect(renderer.summarizePix({ brCode: undefined, issues: issues.slice(0, 2) })).toBe('PIX inválido: falta o campo CRC (63) (+1 problema)');
    expect(renderer.summarizePix({ brCode: undefined, issues })).toBe('PIX inválido: falta o campo CRC (63) (+2 problemas)');
  });

  it('renders valid and invalid documents', () => {
    expect(renderer.render(document())).toBe('✅ CPF 529\\.982\\.247\\-25 é válido');
    const invalid = document({ formatted: '529.982.247-26', validation: { valid: false, issue: { code: 'repeated-characters' } } });
    expect(renderer.summarize(invalid)).toBe('CPF 529.982.247-26 é inválido: todos os caracteres são iguais');
    expect(renderer.render(invalid)).toMatch(/^❌ /);
  });

  it('renders a valid PIX with every field', () => {
    const markdown = renderer.render({
      kind: 'pix',
      decoding: {
        brCode: brCode({
          key: 'fulano@exemplo.com',
          keyType: 'email',
          url: 'pix.exemplo.com/qr',
          amount: '10.50',
          merchantName: 'FULANO | CIA',
          merchantCity: 'RECIFE',
          postalCode: '50000000',
          description: 'Pedido',
          txid: '***',
          initiation: 'static',
          crc: 'ABCD',
        }),
        issues: [],
      },
    });
    expect(markdown).toContain('**PIX copia-e-cola** · ✅ válido');
    expect(markdown).toContain('| Chave | fulano@exemplo\\.com \\(e\\-mail\\) |');
    expect(markdown).toContain('R$');
    expect(markdown).toContain('FULANO \\| CIA');
    expect(markdown).toContain('estático');
    expect(markdown).toContain('| Identificador (txid) | \\*\\*\\* |');
  });

  it('renders free amounts, unknown key types, odd amounts and issues', () => {
    const free = renderer.render({ kind: 'pix', decoding: { brCode: brCode({ key: 'qualquer' }), issues: [] } });
    expect(free).toContain('| Chave | qualquer |');
    expect(free).toContain('livre \\(quem paga digita\\)');
    expect(free).not.toContain('| URL |');
    const odd = renderer.render({ kind: 'pix', decoding: { brCode: brCode({ amount: 'abc', merchantName: '' }), issues: [{ code: 'invalid-amount', actual: 'abc' }] } });
    expect(odd).toContain('| Valor | abc |');
    expect(odd).toContain('❌ inválido');
    expect(odd).toContain('- valor "abc" fora do formato esperado \\(ex\\.: 10\\.50\\)');
    const broken = renderer.render({ kind: 'pix', decoding: { brCode: undefined, issues: [{ code: 'malformed', position: 2 }] } });
    expect(broken).not.toContain('| Campo |');
  });
});

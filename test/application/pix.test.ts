import { describe, expect, it } from 'vitest';
import { generateStaticPix, normalizeAmount } from '../../src/application/pix/generateStaticPix';
import { decodeBrCode } from '../../src/domain/pix/decodeBrCode';
import { qrCodeDataUrl } from '../../src/infrastructure/qrCode';

const form = { key: 'fulano@exemplo.com', merchantName: 'José da Conceição', merchantCity: 'São Paulo', amount: '25,9', txid: 'PEDIDO123' };

describe('generateStaticPix', () => {
  it('builds a valid code without accents and with a normalized amount', () => {
    const { code, issues } = generateStaticPix(form);
    expect(issues).toEqual([]);
    expect(decodeBrCode(code ?? '')).toMatchObject({
      brCode: { key: 'fulano@exemplo.com', merchantName: 'Jose da Conceicao', merchantCity: 'Sao Paulo', amount: '25.90', txid: 'PEDIDO123' },
      issues: [],
    });
  });

  it('omits optional fields', () => {
    const { code } = generateStaticPix({ ...form, amount: ' ', txid: '' });
    expect(decodeBrCode(code ?? '')).toMatchObject({ brCode: { amount: undefined, txid: '***' }, issues: [] });
  });

  it('reports every form problem', () => {
    expect(generateStaticPix({ key: '', merchantName: 'X'.repeat(26), merchantCity: ' ', amount: 'abc', txid: 'a-b' })).toEqual({
      code: undefined,
      issues: [
        { field: 'key', code: 'required' },
        { field: 'merchantName', code: 'too-long', max: 25 },
        { field: 'merchantCity', code: 'required' },
        { field: 'amount', code: 'invalid-amount' },
        { field: 'txid', code: 'invalid-txid' },
      ],
    });
  });

  it('normalizes amounts', () => {
    expect(normalizeAmount('10')).toBe('10.00');
    expect(normalizeAmount('0,5')).toBe('0.50');
    expect(normalizeAmount('')).toBeUndefined();
  });
});

describe('qrCodeDataUrl', () => {
  it('renders an SVG data URL', () => {
    const url = qrCodeDataUrl('000201');
    expect(url).toMatch(/^data:image\/svg\+xml;base64,/);
    expect(Buffer.from(url.split(',')[1] ?? '', 'base64').toString()).toContain('<svg');
  });
});

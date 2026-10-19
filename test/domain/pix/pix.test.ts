import { describe, expect, it } from 'vitest';
import { BR_CODE_RULES } from '../../../src/domain/pix/brCodeRules';
import { crc16Ccitt } from '../../../src/domain/pix/crc16';
import { decodeBrCode } from '../../../src/domain/pix/decodeBrCode';
import { encodeStaticBrCode } from '../../../src/domain/pix/encodeBrCode';
import { inferPixKeyType } from '../../../src/domain/pix/inferPixKeyType';
import { parseTlv, serializeTlv } from '../../../src/domain/pix/tlv';
import { BCB_PIX } from '../../fakes/samples';

const withCrc = (payload: string): string => `${payload}6304${crc16Ccitt(`${payload}6304`)}`;

const pix = (fields: Record<string, string>): string => withCrc(Object.entries(fields).map(([id, value]) => serializeTlv(id, value)).join(''));

const ACCOUNT = serializeTlv('00', 'br.gov.bcb.pix') + serializeTlv('01', 'fulano@exemplo.com');

const BASE = { '00': '01', '26': ACCOUNT, '52': '0000', '53': '986', '58': 'BR', '59': 'FULANO', '60': 'SAO PAULO' };

describe('crc16Ccitt', () => {
  it('matches the CCITT-FALSE reference vector and pads to four digits', () => {
    expect(crc16Ccitt('123456789')).toBe('29B1');
    expect(crc16Ccitt('')).toBe('FFFF');
    expect(crc16Ccitt('00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***6304')).toBe('1D3D');
    expect(crc16Ccitt('aaaaa')).toHaveLength(4);
  });
});

describe('tlv', () => {
  it('parses fields with their absolute positions', () => {
    expect(parseTlv('0002AB0101X', 10)).toEqual({
      ok: true,
      value: [
        { id: '00', value: 'AB', start: 10 },
        { id: '01', value: 'X', start: 16 },
      ],
    });
  });

  it('reports where the structure breaks', () => {
    expect(parseTlv('00AB')).toEqual({ ok: false, error: { position: 0 } });
    expect(parseTlv('0002AB0105X')).toEqual({ ok: false, error: { position: 6 } });
  });

  it('serializes with a two digit length', () => {
    expect(serializeTlv('59', 'ABC')).toBe('5903ABC');
  });
});

describe('inferPixKeyType', () => {
  it.each([
    ['fulano@exemplo.com', 'email'],
    ['+5511999998888', 'phone'],
    ['52998224725', 'cpf'],
    ['12ABC34501DE35', 'cnpj'],
    ['123E4567-E12B-12D1-A456-426655440000', 'random'],
    ['qualquer', undefined],
  ])('classifies %s', (key, type) => {
    expect(inferPixKeyType(key)).toBe(type);
  });
});

describe('decodeBrCode', () => {
  it('decodes the Central Bank reference example', () => {
    expect(decodeBrCode(`  ${BCB_PIX}  `)).toEqual({
      brCode: {
        initiation: undefined,
        key: '123e4567-e12b-12d1-a456-426655440000',
        keyType: 'random',
        url: undefined,
        description: undefined,
        amount: undefined,
        merchantName: 'Fulano de Tal',
        merchantCity: 'BRASILIA',
        postalCode: undefined,
        txid: '***',
        crc: '1D3D',
      },
      issues: [],
    });
  });

  it('reads every optional field', () => {
    const account = serializeTlv('00', 'BR.GOV.BCB.PIX') + serializeTlv('02', 'Pedido 42') + serializeTlv('25', 'pix.exemplo.com/qr/v2/abc');
    const { brCode, issues } = decodeBrCode(pix({ ...BASE, '01': '12', '26': account, '54': '10.50', '61': '01001000', '62': serializeTlv('05', 'PEDIDO42') }));
    expect(issues).toEqual([]);
    expect(brCode).toMatchObject({
      initiation: 'dynamic',
      key: undefined,
      keyType: undefined,
      url: 'pix.exemplo.com/qr/v2/abc',
      description: 'Pedido 42',
      amount: '10.50',
      postalCode: '01001000',
      txid: 'PEDIDO42',
    });
    expect(decodeBrCode(pix({ ...BASE, '01': '11' })).brCode?.initiation).toBe('static');
    expect(decodeBrCode(pix({ ...BASE, '01': '99' })).brCode?.initiation).toBeUndefined();
  });

  it('round-trips static codes built by the encoder', () => {
    const encoded = encodeStaticBrCode({ key: '+5511999998888', merchantName: 'FULANO', merchantCity: 'RECIFE', amount: '1.00', txid: 'T1', description: 'Teste' });
    expect(decodeBrCode(encoded)).toMatchObject({ brCode: { keyType: 'phone', amount: '1.00', txid: 'T1', description: 'Teste', initiation: 'static' }, issues: [] });
    expect(decodeBrCode(encodeStaticBrCode({ key: 'a@b.co', merchantName: 'A', merchantCity: 'B' }))).toMatchObject({ brCode: { txid: '***' }, issues: [] });
  });

  it('reports malformed structures at every level', () => {
    expect(decodeBrCode('000201XX')).toEqual({ brCode: undefined, issues: [{ code: 'malformed', position: 6 }] });
    const brokenAccount = pix({ ...BASE, '26': '00XX' });
    expect(decodeBrCode(brokenAccount)).toEqual({ brCode: undefined, issues: [{ code: 'malformed', position: brokenAccount.indexOf('260400XX') + 4 }] });
    expect(decodeBrCode(pix({ ...BASE, '62': '05XX' })).issues).toEqual([{ code: 'malformed', position: expect.any(Number) }]);
  });

  it('lists every rule violation', () => {
    const fields = { '00': '02', '26': serializeTlv('00', 'outro.gui'), '53': '840', '54': '10,50', '58': 'US', '59': 'X'.repeat(26), '60': 'Y'.repeat(16) };
    const issues = decodeBrCode(`${Object.entries(fields).map(([id, value]) => serializeTlv(id, value)).join('')}63040000`).issues;
    expect(issues).toEqual([
      { code: 'unexpected-value', field: 'payload-format', expected: '01', actual: '02' },
      { code: 'unexpected-value', field: 'gui', expected: 'br.gov.bcb.pix', actual: 'outro.gui' },
      { code: 'missing-field', field: 'key-or-url' },
      { code: 'missing-field', field: 'mcc' },
      { code: 'unexpected-value', field: 'currency', expected: '986', actual: '840' },
      { code: 'invalid-amount', actual: '10,50' },
      { code: 'unexpected-value', field: 'country', expected: 'BR', actual: 'US' },
      { code: 'too-long', field: 'merchant-name', max: 25, actual: 26 },
      { code: 'too-long', field: 'merchant-city', max: 15, actual: 16 },
      { code: 'invalid-crc', expected: expect.stringMatching(/^[0-9A-F]{4}$/), actual: '0000' },
    ]);
  });

  it('reports missing fields', () => {
    expect(decodeBrCode('').issues).toEqual([
      { code: 'missing-field', field: 'payload-format' },
      { code: 'missing-field', field: 'merchant-account' },
      { code: 'missing-field', field: 'mcc' },
      { code: 'missing-field', field: 'currency' },
      { code: 'missing-field', field: 'country' },
      { code: 'missing-field', field: 'merchant-name' },
      { code: 'missing-field', field: 'merchant-city' },
      { code: 'missing-field', field: 'crc' },
    ]);
    const withoutGui = decodeBrCode(pix({ ...BASE, '26': serializeTlv('01', 'chave') })).issues;
    expect(withoutGui).toEqual([{ code: 'missing-field', field: 'gui' }]);
  });

  it('requires the CRC to be the last field and accepts lowercase checksums', () => {
    const misplaced = `${serializeTlv('63', 'ABCD')}${serializeTlv('00', '01')}`;
    expect(decodeBrCode(misplaced).issues).toContainEqual({ code: 'missing-field', field: 'crc' });
    expect(decodeBrCode(BCB_PIX.replace('1D3D', '1d3d')).issues).toEqual([]);
  });

  it('accepts custom rules', () => {
    expect(decodeBrCode(BCB_PIX, [() => [{ code: 'invalid-amount', actual: 'x' }]]).issues).toEqual([{ code: 'invalid-amount', actual: 'x' }]);
    expect(BR_CODE_RULES.length).toBeGreaterThan(10);
  });
});

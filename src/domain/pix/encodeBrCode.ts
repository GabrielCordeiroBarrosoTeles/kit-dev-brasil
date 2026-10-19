import { PIX_GUI } from './brCodeRules';
import { crc16Ccitt } from './crc16';
import { serializeTlv } from './tlv';

export interface StaticPixInput {
  readonly key: string;
  readonly merchantName: string;
  readonly merchantCity: string;
  readonly amount?: string;
  readonly txid?: string;
  readonly description?: string;
}

const DEFAULT_TXID = '***';

export const encodeStaticBrCode = (input: StaticPixInput): string => {
  const account = [serializeTlv('00', PIX_GUI), serializeTlv('01', input.key), input.description ? serializeTlv('02', input.description) : ''].join('');
  const payload = [
    serializeTlv('00', '01'),
    serializeTlv('01', '11'),
    serializeTlv('26', account),
    serializeTlv('52', '0000'),
    serializeTlv('53', '986'),
    input.amount ? serializeTlv('54', input.amount) : '',
    serializeTlv('58', 'BR'),
    serializeTlv('59', input.merchantName),
    serializeTlv('60', input.merchantCity),
    serializeTlv('62', serializeTlv('05', input.txid ?? DEFAULT_TXID)),
    '6304',
  ].join('');
  return payload + crc16Ccitt(payload);
};

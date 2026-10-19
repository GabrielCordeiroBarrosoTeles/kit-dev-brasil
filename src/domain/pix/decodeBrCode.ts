import { ok } from '../shared/Result';
import type { Result } from '../shared/Result';
import { BR_CODE_RULES } from './brCodeRules';
import type { BrCodeContext, BrCodeRule } from './brCodeRules';
import { inferPixKeyType } from './inferPixKeyType';
import { parseTlv } from './tlv';
import type { MalformedTlv, TlvField } from './tlv';
import type { BrCode, BrCodeDecoding, PixInitiation } from './types';

type Fields = ReadonlyMap<string, string>;

const INITIATIONS: Readonly<Record<string, PixInitiation>> = { '11': 'static', '12': 'dynamic' };
const HEADER_LENGTH = 4;

const toMap = (fields: readonly TlvField[]): Fields => new Map(fields.map((field) => [field.id, field.value]));

const findField = (fields: readonly TlvField[], id: string): TlvField | undefined => fields.find((field) => field.id === id);

const parseNested = (field: TlvField | undefined): Result<Fields, MalformedTlv> => {
  if (!field) {
    return ok(new Map());
  }
  const parsed = parseTlv(field.value, field.start + HEADER_LENGTH);
  return parsed.ok ? ok(toMap(parsed.value)) : parsed;
};

const malformed = ({ position }: MalformedTlv): BrCodeDecoding => ({ brCode: undefined, issues: [{ code: 'malformed', position }] });

const toBrCode = ({ fields, account, crcField }: BrCodeContext, additional: Fields): BrCode => {
  const key = account.get('01');
  const initiation = fields.get('01');
  return {
    initiation: initiation === undefined ? undefined : INITIATIONS[initiation],
    key,
    keyType: key === undefined ? undefined : inferPixKeyType(key),
    url: account.get('25'),
    description: account.get('02'),
    amount: fields.get('54'),
    merchantName: fields.get('59'),
    merchantCity: fields.get('60'),
    postalCode: fields.get('61'),
    txid: additional.get('05'),
    crc: crcField?.value,
  };
};

export const decodeBrCode = (rawInput: string, rules: readonly BrCodeRule[] = BR_CODE_RULES): BrCodeDecoding => {
  const input = rawInput.trim();
  const parsed = parseTlv(input);
  if (!parsed.ok) {
    return malformed(parsed.error);
  }
  const account = parseNested(findField(parsed.value, '26'));
  if (!account.ok) {
    return malformed(account.error);
  }
  const additional = parseNested(findField(parsed.value, '62'));
  if (!additional.ok) {
    return malformed(additional.error);
  }
  const context: BrCodeContext = { input, fields: toMap(parsed.value), account: account.value, crcField: findField(parsed.value, '63') };
  return { brCode: toBrCode(context, additional.value), issues: rules.flatMap((rule) => rule(context)) };
};

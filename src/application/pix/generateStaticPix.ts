import { encodeStaticBrCode } from '../../domain/pix/encodeBrCode';

export interface PixForm {
  readonly key: string;
  readonly merchantName: string;
  readonly merchantCity: string;
  readonly amount: string;
  readonly txid: string;
}

export type PixFormField = keyof PixForm;

export type PixFormIssue =
  | { readonly field: PixFormField; readonly code: 'required' }
  | { readonly field: PixFormField; readonly code: 'too-long'; readonly max: number }
  | { readonly field: 'amount'; readonly code: 'invalid-amount' }
  | { readonly field: 'txid'; readonly code: 'invalid-txid' };

export interface PixGeneration {
  readonly code: string | undefined;
  readonly issues: readonly PixFormIssue[];
}

const LIMITS = { key: 77, merchantName: 25, merchantCity: 15, txid: 25 } as const;
const AMOUNT = /^\d{1,10}(?:[.,]\d{1,2})?$/;
const TXID = /^[A-Za-z0-9]{1,25}$/;

const plain = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();

export const normalizeAmount = (amount: string): string | undefined => {
  const value = amount.trim().replace(',', '.');
  return value === '' ? undefined : Number(value).toFixed(2);
};

const checkRequired = (form: PixForm, field: 'key' | 'merchantName' | 'merchantCity'): PixFormIssue[] => {
  const value = plain(form[field]);
  if (value === '') {
    return [{ field, code: 'required' }];
  }
  return value.length > LIMITS[field] ? [{ field, code: 'too-long', max: LIMITS[field] }] : [];
};

const checkOptional = (form: PixForm): PixFormIssue[] => {
  const amount = form.amount.trim();
  const txid = form.txid.trim();
  return [
    ...(amount === '' || AMOUNT.test(amount) ? [] : [{ field: 'amount', code: 'invalid-amount' } as const]),
    ...(txid === '' || TXID.test(txid) ? [] : [{ field: 'txid', code: 'invalid-txid' } as const]),
  ];
};

export const generateStaticPix = (form: PixForm): PixGeneration => {
  const issues = [...checkRequired(form, 'key'), ...checkRequired(form, 'merchantName'), ...checkRequired(form, 'merchantCity'), ...checkOptional(form)];
  if (issues.length > 0) {
    return { code: undefined, issues };
  }
  const amount = normalizeAmount(form.amount);
  const txid = form.txid.trim();
  const code = encodeStaticBrCode({
    key: plain(form.key),
    merchantName: plain(form.merchantName),
    merchantCity: plain(form.merchantCity),
    ...(amount === undefined ? {} : { amount }),
    ...(txid === '' ? {} : { txid }),
  });
  return { code, issues: [] };
};

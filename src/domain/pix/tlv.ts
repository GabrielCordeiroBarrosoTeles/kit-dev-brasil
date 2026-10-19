import { fail, ok } from '../shared/Result';
import type { Result } from '../shared/Result';

export interface TlvField {
  readonly id: string;
  readonly value: string;
  readonly start: number;
}

export interface MalformedTlv {
  readonly position: number;
}

const HEADER_LENGTH = 4;
const HEADER = /^\d{4}$/;

export const parseTlv = (input: string, offset = 0): Result<readonly TlvField[], MalformedTlv> => {
  const fields: TlvField[] = [];
  let position = 0;
  while (position < input.length) {
    const header = input.slice(position, position + HEADER_LENGTH);
    if (!HEADER.test(header)) {
      return fail({ position: offset + position });
    }
    const length = Number(header.slice(2));
    const valueStart = position + HEADER_LENGTH;
    const value = input.slice(valueStart, valueStart + length);
    if (value.length !== length) {
      return fail({ position: offset + position });
    }
    fields.push({ id: header.slice(0, 2), value, start: offset + position });
    position = valueStart + length;
  }
  return ok(fields);
};

export const serializeTlv = (id: string, value: string): string => `${id}${String(value.length).padStart(2, '0')}${value}`;

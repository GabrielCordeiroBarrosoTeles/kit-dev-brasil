import { describe, expect, it } from 'vitest';
import { Cnpj } from '../../../src/domain/documents/Cnpj';
import { Cpf } from '../../../src/domain/documents/Cpf';
import { DocumentRegistry } from '../../../src/domain/documents/DocumentRegistry';
import { isRepeated } from '../../../src/domain/documents/validation';
import { VALID_CNPJ, VALID_CPF } from '../../fakes/samples';

const registry = new DocumentRegistry([new Cpf(), new Cnpj()]);

describe('DocumentRegistry', () => {
  it('identifies documents by shape', () => {
    expect(registry.identify(VALID_CPF)?.kind).toBe('cpf');
    expect(registry.identify(VALID_CNPJ)?.kind).toBe('cnpj');
    expect(registry.identify('hello')).toBeUndefined();
  });

  it('finds types by kind', () => {
    expect(registry.byKind('cnpj')?.label).toBe('CNPJ');
    expect(new DocumentRegistry([]).byKind('cpf')).toBeUndefined();
  });
});

describe('isRepeated', () => {
  it('needs at least two equal characters', () => {
    expect(isRepeated('aa')).toBe(true);
    expect(isRepeated('a')).toBe(false);
    expect(isRepeated('ab')).toBe(false);
  });
});

import { describe, expect, it, vi } from 'vitest';
import { DocumentGenerator } from '../../src/application/generation/DocumentGenerator';
import { GeneratedValues } from '../../src/application/generation/GeneratedValues';
import { GENERATOR_IDS, isGeneratorId } from '../../src/application/generation/generatorIds';
import { Cpf } from '../../src/domain/documents/Cpf';
import { sequenceRandom } from '../fakes/random';

const cpf = new Cpf();

const values = () => {
  let counter = 0;
  const generator = new DocumentGenerator({ cpf: { label: 'CPF', type: cpf, generate: () => `0000000000${(counter += 1)}` } }, sequenceRandom([0]));
  return new GeneratedValues(generator);
};

describe('generatorIds', () => {
  it('recognizes only known generators', () => {
    expect(GENERATOR_IDS).toHaveLength(16);
    expect(GENERATOR_IDS).toContain('cardElo');
    expect(isGeneratorId('cnpj')).toBe(true);
    expect(isGeneratorId('pix')).toBe(false);
    expect(isGeneratorId(undefined)).toBe(false);
  });
});

describe('GeneratedValues', () => {
  it('remembers the latest value and notifies listeners until they unsubscribe', () => {
    const store = values();
    const listener = vi.fn();
    const unsubscribe = store.onDidChange(listener);
    expect(store.current('cpf')).toBeUndefined();
    expect(store.next('cpf', false)).toBe('00000000001');
    expect(store.current('cpf')).toBe('00000000001');
    expect(store.label('cpf')).toBe('CPF');
    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
    store.next('cpf', true);
    expect(listener).toHaveBeenCalledOnce();
    expect(store.current('cpf')).toBe('000.000.000-02');
  });

  it('reuses the current value or creates the first one', () => {
    const store = values();
    expect(store.currentOrNext('cpf', false)).toBe('00000000001');
    expect(store.currentOrNext('cpf', false)).toBe('00000000001');
  });
});

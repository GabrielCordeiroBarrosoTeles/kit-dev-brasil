import { describe, expect, it } from 'vitest';
import { decodeTestBoleto } from '../fakes/boleto';
import { createDocumentCatalog } from '../../src/application/catalog';
import { GENERATOR_IDS } from '../../src/application/generation/generatorIds';
import { TextInspector } from '../../src/application/inspection/TextInspector';
import { DocumentRegistry } from '../../src/domain/documents/DocumentRegistry';
import { decodeBrCode } from '../../src/domain/pix/decodeBrCode';
import { InspectionRenderer } from '../../src/presentation/InspectionRenderer';
import { NOT_A_DOCUMENT, summarizeCandidates } from '../../src/presentation/candidateSummary';
import { GENERATOR_GROUPS, GENERATOR_LABELS } from '../../src/shared/generatorCatalog';
import { lcgRandom } from '../fakes/random';

const catalog = createDocumentCatalog();
const inspector = new TextInspector(new DocumentRegistry(catalog.types), decodeBrCode, decodeTestBoleto);
const renderer = new InspectionRenderer();

describe('document catalog', () => {
  it('generates a valid value for every generator', () => {
    for (const id of GENERATOR_IDS) {
      const { type, generate, label } = catalog.generators[id];
      const value = generate(lcgRandom(7));
      expect(type.validate(value), `${id} ${value}`).toEqual({ valid: true });
      expect(label).toBe(GENERATOR_LABELS[id]);
    }
  });

  it('groups every generator exactly once', () => {
    expect(GENERATOR_GROUPS.flatMap((group) => group.ids).sort()).toEqual([...GENERATOR_IDS].sort());
  });
});

describe('candidates', () => {
  it('lists every type that accepts the text and adds details when valid', () => {
    const kinds = inspector.inspectCandidates('52998224725').map((inspection) => inspection.document);
    expect(kinds).toEqual(['cpf', 'cnh', 'pis', 'renavam']);
    expect(inspector.inspectCandidates('4111 1111 1111 1111')).toMatchObject([{ document: 'credit-card', details: 'Visa' }]);
    expect(inspector.inspectCandidates('4111 1111 1111 1112')).toMatchObject([{ document: 'credit-card', details: undefined }]);
    expect(new DocumentRegistry(catalog.types).candidates('hello')).toEqual([]);
  });
});

describe('summarizeCandidates', () => {
  const summarize = (text: string) => summarizeCandidates(inspector.inspectCandidates(text), renderer);

  it('handles unknown text, a single match and multiple matches', () => {
    expect(summarize('hello')).toEqual({ valid: undefined, message: NOT_A_DOCUMENT, formatted: undefined });
    expect(summarize('52998224725')).toEqual({ valid: true, message: 'CPF 529.982.247-25 é válido', formatted: '529.982.247-25' });
    expect(summarize('4111 1111 1111 1111')).toEqual({ valid: true, message: 'Cartão 4111 1111 1111 1111 (Visa) é válido', formatted: '4111 1111 1111 1111' });
    expect(summarize('4111 1111 1111 1112')).toMatchObject({ valid: false, message: expect.stringContaining('é inválido'), formatted: '4111 1111 1111 1112' });
    expect(summarize('00000000000')).toEqual({ valid: false, message: 'Não é válido como CPF, CNH, PIS/PASEP nem RENAVAM', formatted: undefined });
  });

  it('lists every type a value is valid for', () => {
    const both = ['60020666261'].map(summarize)[0];
    expect(both).toEqual({ valid: true, message: 'Válido como PIS/PASEP e RENAVAM', formatted: '600.20666.26-1' });
    const many = inspector.inspectCandidates('52998224725').map((inspection) => ({ ...inspection, validation: { valid: true } as const }));
    expect(summarizeCandidates(many, renderer).message).toBe('Válido como CPF, CNH, PIS/PASEP e RENAVAM');
  });
});

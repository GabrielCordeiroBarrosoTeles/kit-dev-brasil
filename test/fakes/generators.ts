import { createDocumentCatalog } from '../../src/application/catalog';
import type { GeneratorSpec } from '../../src/application/generation/DocumentGenerator';
import type { GeneratorId } from '../../src/application/generation/generatorIds';
import { GENERATOR_IDS } from '../../src/application/generation/generatorIds';

export const catalogGenerators = (overrides: Partial<Record<GeneratorId, GeneratorSpec>> = {}): Record<GeneratorId, GeneratorSpec> => ({
  ...createDocumentCatalog().generators,
  ...overrides,
});

export const emptyGenerated = (values: Partial<Record<GeneratorId, string>> = {}): Record<GeneratorId, string | undefined> => ({
  ...(Object.fromEntries(GENERATOR_IDS.map((id) => [id, undefined])) as Record<GeneratorId, string | undefined>),
  ...values,
});

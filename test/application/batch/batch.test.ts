import { describe, expect, it } from 'vitest';
import { BatchGenerator, SEED_REFERENCE_DATE } from '../../../src/application/batch/BatchGenerator';
import type { BatchRequest } from '../../../src/application/batch/types';
import { createDocumentCatalog } from '../../../src/application/catalog';
import { cityByPostalCode } from '../../../src/domain/brazil/cities';
import { PROFILE_COLUMNS } from '../../../src/presentation/batchColumns';
import { createRecordFactory, toRecord } from '../../../src/presentation/batchRecords';
import { lcgRandom } from '../../fakes/random';
import { TODAY } from '../../fakes/samples';

const catalog = createDocumentCatalog();
const generator = (seed = 3) => new BatchGenerator(createRecordFactory(catalog), lcgRandom(seed), () => TODAY);

const request = (overrides: Partial<BatchRequest> = {}): BatchRequest => ({
  source: 'person',
  count: 5,
  state: undefined,
  formatted: true,
  seed: undefined,
  format: 'json',
  name: 'pessoas',
  columns: [],
  ...overrides,
});

describe('BatchGenerator', () => {
  it('repeats the batch for the same seed, whatever the injected random', () => {
    const seeded = request({ seed: '42', count: 20 });
    expect(generator(1).generate(seeded)).toEqual(generator(2).generate(seeded));
    expect(generator(1).generate(seeded)).not.toEqual(generator(1).generate(request({ seed: '43', count: 20 })));
    expect(generator(1).generate(request({ seed: '42', source: 'cpf' }))).toEqual(generator(9).generate(request({ seed: '42', source: 'cpf' })));
  });

  it('dates seeded batches from the fixed reference and unseeded ones from today', () => {
    const born = (records: readonly Record<string, unknown>[]) => records.map((record) => Number(String(record.dataNascimento).slice(0, 4)));
    const seeded = generator().generate(request({ seed: 'datas', count: 200 }));
    expect(Math.max(...born(seeded))).toBeLessThanOrEqual(SEED_REFERENCE_DATE.getUTCFullYear() - 18);
    const unseeded = generator().generate(request({ count: 200 }));
    expect(Math.max(...born(unseeded))).toBeLessThanOrEqual(TODAY.getUTCFullYear() - 18);
    expect(generator(5).generate(request())).not.toEqual(generator(6).generate(request()));
  });

  it('keeps a thousand seeded people valid and coherent', () => {
    const { cpf, voterTitle } = catalog.person;
    const records = generator().generate(request({ seed: 'mil', count: 1000, state: 'BA' }));
    expect(records).toHaveLength(1000);
    for (const record of records) {
      expect(cpf.validate(String(record.cpf)).valid).toBe(true);
      expect(voterTitle.validate(String(record.tituloEleitor)).valid).toBe(true);
      expect(record.uf).toBe('BA');
      expect(cityByPostalCode(Number(String(record.cep).replace('-', '')))?.name).toBe(record.cidade);
      expect(Object.keys(record).every((key) => PROFILE_COLUMNS.person.some((column) => column.key === key))).toBe(true);
    }
  });

  it('builds company and document records', () => {
    const [company] = generator().generate(request({ source: 'company', count: 1, state: 'RS' }));
    expect(company).toMatchObject({ uf: 'RS' });
    expect(Object.keys(company ?? {}).every((key) => PROFILE_COLUMNS.company.some((column) => column.key === key))).toBe(true);
    const documents = generator().generate(request({ source: 'cep', count: 3, formatted: false }));
    expect(documents.map((record) => Object.keys(record))).toEqual([['cep'], ['cep'], ['cep']]);
    expect(String(documents[0]?.cep)).toMatch(/^\d{8}$/);
    expect(toRecord({ kind: 'person', fields: [{ key: 'nome', label: 'Nome', value: 'Ana', display: 'Ana' }], address: [{ key: 'uf', label: 'UF', value: 'CE', display: 'CE' }] })).toEqual({ nome: 'Ana', uf: 'CE' });
  });
});

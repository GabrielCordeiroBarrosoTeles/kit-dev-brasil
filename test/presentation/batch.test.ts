import { describe, expect, it } from 'vitest';
import type { BatchRecord, BatchRequest } from '../../src/application/batch/types';
import { batchColumns, defaultBatchName, isProfileSource } from '../../src/presentation/batchColumns';
import { renderBatch } from '../../src/presentation/batchExporters';
import { isValidBatchCount, toBatchRequest, toBatchTemplate, validTemplates } from '../../src/presentation/batchRequest';
import type { BatchIssue } from '../../src/presentation/batchRequest';
import { describeBatchIssue } from '../../src/presentation/messages';
import { toBatchFormValues, toBatchTemplateViews } from '../../src/presentation/sidebarViews';

const records: BatchRecord[] = [
  { nome: "Ana D'Ávila", idade: 30, cnh: undefined, cidade: 'São Paulo, SP' },
  { nome: 'Bruno "Bê" Lima', idade: 41, cnh: '02650306461', cidade: 'Recife\nPE' },
];

const request = (overrides: Partial<BatchRequest> = {}): BatchRequest => ({
  source: 'person',
  count: 2,
  state: undefined,
  formatted: true,
  seed: undefined,
  format: 'json',
  name: 'clientes',
  columns: [
    { key: 'nome', column: 'full_name' },
    { key: 'idade', column: 'age' },
    { key: 'cnh', column: 'cnh' },
    { key: 'cidade', column: 'city' },
  ],
  ...overrides,
});

describe('batch columns', () => {
  it('lists profile columns or the document column', () => {
    expect(batchColumns('person').map(({ key }) => key)).toContain('tituloEleitor');
    expect(batchColumns('company').map(({ key }) => key)).toContain('razaoSocial');
    expect(batchColumns('cep')).toEqual([{ key: 'cep', label: 'CEP' }]);
    expect([defaultBatchName('person'), defaultBatchName('company'), defaultBatchName('cnpj')]).toEqual(['pessoas', 'empresas', 'cnpj']);
    expect([isProfileSource('person'), isProfileSource('cpf')]).toEqual([true, false]);
  });
});

describe('batch exporters', () => {
  it('exports JSON with renamed columns and null for missing values', () => {
    const { content, language } = renderBatch(records, request());
    expect(language).toBe('json');
    expect(JSON.parse(content)).toEqual([
      { full_name: "Ana D'Ávila", age: 30, cnh: null, city: 'São Paulo, SP' },
      { full_name: 'Bruno "Bê" Lima', age: 41, cnh: '02650306461', city: 'Recife\nPE' },
    ]);
  });

  it('exports CSV quoting only when needed', () => {
    expect(renderBatch(records, request({ format: 'csv' }))).toEqual({
      language: 'plaintext',
      content: ['full_name,age,cnh,city', `Ana D'Ávila,30,,"São Paulo, SP"`, '"Bruno ""Bê"" Lima",41,02650306461,"Recife\nPE"'].join('\n'),
    });
  });

  it('exports SQL inserts with escaped quotes, raw numbers and NULL', () => {
    expect(renderBatch(records, request({ format: 'sql' }))).toEqual({
      language: 'sql',
      content: [
        'INSERT INTO clientes (full_name, age, cnh, city) VALUES',
        "  ('Ana D''Ávila', 30, NULL, 'São Paulo, SP'),",
        "  ('Bruno \"Bê\" Lima', 41, '02650306461', 'Recife\nPE');",
      ].join('\n'),
    });
  });

  it('exports a TypeScript array', () => {
    const { content, language } = renderBatch(records.slice(0, 1), request({ format: 'typescript' }));
    expect(language).toBe('typescript');
    expect(content).toBe(["export const clientes = [", '  {', "    full_name: 'Ana D\\'Ávila',", '    age: 30,', '    cnh: null,', "    city: 'São Paulo, SP',", '  },', '];'].join('\n'));
  });
});

describe('batch request', () => {
  it('accepts panel values with defaults', () => {
    const { request: parsed, issues } = toBatchRequest({ source: 'person', count: ' 25 ', format: 'csv', state: 'PE', seed: ' 42 ', name: '', columns: [{ key: 'nome', column: 'full_name' }, { key: 'cpf', column: '' }, { key: 'senha', column: 'x' }] });
    expect(issues).toEqual([]);
    expect(parsed).toEqual({
      source: 'person',
      count: 25,
      format: 'csv',
      state: 'PE',
      seed: '42',
      name: 'pessoas',
      formatted: true,
      columns: [
        { key: 'nome', column: 'full_name' },
        { key: 'cpf', column: 'cpf' },
      ],
    });
  });

  it('accepts saved templates with a column map and uses every column when none is given', () => {
    expect(toBatchRequest({ source: 'company', count: 3, format: 'sql', name: 'companies', state: 'XX', seed: '', formatted: false, columns: { cnpj: 'tax_id', razaoSocial: 'name' } }).request).toEqual({
      source: 'company',
      count: 3,
      format: 'sql',
      name: 'companies',
      state: undefined,
      seed: undefined,
      formatted: false,
      columns: [
        { key: 'cnpj', column: 'tax_id' },
        { key: 'razaoSocial', column: 'name' },
      ],
    });
    expect(toBatchRequest({ source: 'cpf', count: 1, format: 'json' }).request?.columns).toEqual([{ key: 'cpf', column: 'cpf' }]);
    expect(toBatchRequest({ source: 'cpf', count: 1, format: 'json', columns: 'cpf' }).request?.columns).toEqual([{ key: 'cpf', column: 'cpf' }]);
  });

  it('reports every problem', () => {
    expect(toBatchRequest(undefined)).toEqual({ request: undefined, issues: [{ code: 'invalid-source' }] });
    expect(toBatchRequest({ source: 'robot' }).issues).toEqual([{ code: 'invalid-source' }]);
    expect(toBatchRequest({ source: 'person', count: 0, format: 'xml', name: 'minha tabela', columns: [{ key: 'nome', column: 'nome completo' }] }).issues).toEqual([
      { code: 'invalid-count', min: 1, max: 1000 },
      { code: 'invalid-format' },
      { code: 'invalid-name', name: 'minha tabela' },
      { code: 'invalid-column', column: 'nome completo' },
    ]);
    expect(toBatchRequest({ source: 'person', count: 2, format: 'xml' }).issues).toEqual([{ code: 'invalid-format' }]);
    expect(toBatchRequest({ source: 'person', count: 2, format: 'json', columns: [] }).issues).toEqual([{ code: 'no-columns' }]);
    expect(toBatchRequest({ source: 'person', count: 2, format: 'json', columns: [null] }).issues).toEqual([{ code: 'no-columns' }]);
    expect([isValidBatchCount('1000'), isValidBatchCount('1001'), isValidBatchCount('2.5'), isValidBatchCount(''), isValidBatchCount(7)]).toEqual([true, false, false, false, true]);
  });

  it('converts to and from saved templates', () => {
    const full = request({ state: 'SP', seed: '42' });
    expect(toBatchTemplate(full)).toEqual({ source: 'person', count: 2, formatted: true, format: 'json', name: 'clientes', state: 'SP', seed: '42', columns: { nome: 'full_name', idade: 'age', cnh: 'cnh', cidade: 'city' } });
    expect(toBatchTemplate(request())).not.toHaveProperty('state');
    expect(validTemplates({ bom: toBatchTemplate(full), ruim: { source: 'x' } }).map(({ name }) => name)).toEqual(['bom']);
  });

  it('describes issues in Portuguese', () => {
    const issues: BatchIssue[] = [
      { code: 'invalid-source' },
      { code: 'invalid-count', min: 1, max: 1000 },
      { code: 'invalid-format' },
      { code: 'invalid-name', name: 'a b' },
      { code: 'invalid-column', column: 'c d' },
      { code: 'no-columns' },
    ];
    expect(issues.map(describeBatchIssue)).toEqual([
      'Escolha o que gerar.',
      'A quantidade deve ser um número inteiro de 1 a 1000.',
      'Escolha o formato: JSON, CSV, SQL ou TypeScript.',
      '"a b" não serve como nome de tabela ou variável: use letras sem acento, números e _, começando por letra.',
      '"c d" não serve como nome de coluna: use letras sem acento, números e _, começando por letra.',
      'Marque pelo menos um campo.',
    ]);
  });

  it('builds form values for the panel', () => {
    expect(toBatchFormValues(request())).toMatchObject({ count: '2', state: '', seed: '' });
    expect(toBatchTemplateViews([{ name: 'm', request: request({ state: 'CE', seed: 's' }) }])).toMatchObject([{ name: 'm', values: { state: 'CE', seed: 's', source: 'person' } }]);
  });
});

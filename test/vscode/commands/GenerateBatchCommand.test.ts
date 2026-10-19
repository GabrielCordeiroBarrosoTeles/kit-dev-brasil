import { describe, expect, it, vi } from 'vitest';
import type { BatchRequest } from '../../../src/application/batch/types';
import { BatchGenerator } from '../../../src/application/batch/BatchGenerator';
import { createDocumentCatalog } from '../../../src/application/catalog';
import { toBatchTemplate } from '../../../src/presentation/batchRequest';
import { BatchRunner } from '../../../src/vscode/batch/BatchRunner';
import { GenerateBatchCommand } from '../../../src/vscode/commands/GenerateBatchCommand';
import { COMMAND_MESSAGES } from '../../../src/vscode/commands/messages';
import type { InputRequest, IQuickPick, PickEntry } from '../../../src/vscode/types';
import { FakeNotifier, fakeSettings } from '../../fakes/FakeEditor';
import { lcgRandom } from '../../fakes/random';
import { TODAY } from '../../fakes/samples';
import { createRecordFactory } from '../../../src/presentation/batchRecords';

const template: BatchRequest = { source: 'cnpj', count: 2, state: undefined, formatted: true, seed: '1', format: 'csv', name: 'empresas', columns: [{ key: 'cnpj', column: 'tax_id' }] };

const setup = (picks: unknown[], answers: (string | undefined)[], templates: Record<string, unknown> = {}) => {
  const entries: unknown[][] = [];
  const picker: IQuickPick = {
    pick: <T>(items: readonly PickEntry<T>[]) => {
      entries.push([...items]);
      return Promise.resolve(picks.shift() as T | undefined);
    },
  };
  const requests: InputRequest[] = [];
  const prompt = { ask: (request: InputRequest) => (requests.push(request), Promise.resolve(answers.shift())) };
  const runner = { run: vi.fn((_request: BatchRequest) => Promise.resolve()) };
  const notifier = new FakeNotifier();
  const settings = fakeSettings({ generateFormatted: false, batchTemplates: templates });
  const command = new GenerateBatchCommand('kit.batch', { picker, prompt, settings, runner, notifier, groups: [{ label: 'Endereço', ids: ['cep'] }] });
  return { command, entries, requests, runner, notifier };
};

describe('GenerateBatchCommand', () => {
  it('lists saved templates first and runs a chosen template directly', async () => {
    const { command, entries, runner } = setup([{ template }], [], { clientes: toBatchTemplate(template), quebrado: { source: 'x' } });
    await command.execute();
    expect(entries[0]).toEqual([
      { separator: COMMAND_MESSAGES.batchTemplates },
      { label: 'clientes', value: { template } },
      { separator: COMMAND_MESSAGES.batchProfiles },
      { label: 'Pessoas', value: { source: 'person' } },
      { label: 'Empresas', value: { source: 'company' } },
      { separator: 'Endereço' },
      { label: 'CEP', value: { source: 'cep' } },
    ]);
    expect(runner.run).toHaveBeenCalledWith(template);
  });

  it('asks count and format for a source', async () => {
    const { command, entries, requests, runner } = setup([{ source: 'person' }, 'typescript'], ['5']);
    await command.execute();
    expect(entries[0]?.[0]).toEqual({ separator: COMMAND_MESSAGES.batchProfiles });
    expect(entries[1]).toHaveLength(4);
    expect(requests[0]?.feedback('7')).toBeUndefined();
    expect(requests[0]?.feedback('0')).toEqual({ valid: false, message: 'A quantidade deve ser um número inteiro de 1 a 1000.' });
    expect(runner.run).toHaveBeenCalledWith(expect.objectContaining({ source: 'person', count: 5, format: 'typescript', formatted: false, name: 'pessoas' }));
  });

  it('stops on cancel and warns on an invalid count', async () => {
    for (const [picks, answers] of [[[undefined], []], [[{ source: 'cpf' }], [undefined]], [[{ source: 'cpf' }, undefined], ['3']]] as const) {
      const { command, runner } = setup([...picks], [...answers]);
      await command.execute();
      expect(runner.run).not.toHaveBeenCalled();
    }
    const { command, runner, notifier } = setup([{ source: 'cpf' }, 'json'], ['5000']);
    await command.execute();
    expect(runner.run).not.toHaveBeenCalled();
    expect(notifier.warnings).toEqual(['A quantidade deve ser um número inteiro de 1 a 1000.']);
  });
});

describe('BatchRunner', () => {
  it('renders the batch and opens it', async () => {
    const opened: [string, string][] = [];
    const notifier = new FakeNotifier();
    const runner = new BatchRunner(new BatchGenerator(createRecordFactory(createDocumentCatalog()), lcgRandom(1), () => TODAY), { open: (content, language) => (opened.push([content, language]), Promise.resolve()) }, notifier);
    await runner.run(template);
    await runner.run({ ...template, count: 1 });
    expect(opened[0]?.[1]).toBe('plaintext');
    expect(opened[0]?.[0].split('\n')).toHaveLength(3);
    expect(opened[0]?.[0]).toMatch(/^tax_id\n\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\n/);
    expect(notifier.statuses).toEqual(['2 registros gerados.', '1 registro gerado.']);
  });
});

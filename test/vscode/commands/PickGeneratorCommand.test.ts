import { describe, expect, it, vi } from 'vitest';
import { COMMAND_MESSAGES } from '../../../src/vscode/commands/messages';
import { PickGeneratorCommand, toPickEntries } from '../../../src/vscode/commands/PickGeneratorCommand';
import type { IQuickPick, PickEntry } from '../../../src/vscode/types';

describe('PickGeneratorCommand', () => {
  it('builds grouped entries', () => {
    expect(toPickEntries([{ label: 'Pessoa', ids: ['cpf', 'rg'] }])).toEqual([
      { separator: 'Pessoa' },
      { label: 'CPF', value: 'cpf' },
      { label: 'RG (SP)', value: 'rg' },
    ]);
  });

  it('generates the chosen document and ignores cancellations', async () => {
    const generate = vi.fn((_id: string) => Promise.resolve());
    const answers: (string | undefined)[] = ['cnh', undefined];
    const placeholders: string[] = [];
    const picker: IQuickPick = {
      pick: <T>(_entries: readonly PickEntry<T>[], placeholder: string) => {
        placeholders.push(placeholder);
        return Promise.resolve(answers.shift() as T | undefined);
      },
    };
    const command = new PickGeneratorCommand('kit.pick', picker, [{ label: 'Pessoa', ids: ['cnh'] }], generate);
    await command.execute();
    await command.execute();
    expect(placeholders).toEqual([COMMAND_MESSAGES.pickGenerator, COMMAND_MESSAGES.pickGenerator]);
    expect(generate.mock.calls).toEqual([['cnh']]);
  });
});

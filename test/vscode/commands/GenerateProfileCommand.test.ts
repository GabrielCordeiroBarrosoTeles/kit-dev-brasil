import { describe, expect, it } from 'vitest';
import { personProfile } from '../../../src/presentation/profiles';
import type { ProfileKind } from '../../../src/presentation/profiles';
import { GenerateProfileCommand } from '../../../src/vscode/commands/GenerateProfileCommand';
import { COMMAND_MESSAGES } from '../../../src/vscode/commands/messages';
import type { IQuickPick, PickEntry } from '../../../src/vscode/types';
import { editorProvider, FakeEditor, FakeNotifier } from '../../fakes/FakeEditor';
import { fakeProfiles } from '../../fakes/profiles';

const setup = (answers: (string | undefined)[], editor: FakeEditor | undefined) => {
  const entries: unknown[] = [];
  const picker: IQuickPick = {
    pick: <T>(items: readonly PickEntry<T>[], placeholder: string) => {
      entries.push(items, placeholder);
      return Promise.resolve(answers.shift() as T | undefined);
    },
  };
  const kinds: ProfileKind[] = [];
  const generators = fakeProfiles();
  const generate = (kind: ProfileKind) => (kinds.push(kind), personProfile(generators.person.generate({ state: 'SP', sex: undefined, formatted: true })));
  const copied: string[] = [];
  const clipboard = { writeText: (text: string) => (copied.push(text), Promise.resolve()) };
  const notifier = new FakeNotifier();
  const command = new GenerateProfileCommand('kit.person', 'person', generate, picker, clipboard, editorProvider(editor), notifier);
  return { command, entries, kinds, copied, notifier };
};

describe('GenerateProfileCommand', () => {
  it('asks the format and inserts one profile per cursor', async () => {
    const editor = new FakeEditor(['', '']);
    const { command, entries, kinds } = setup(['json', undefined], editor);
    await command.execute();
    await command.execute();
    expect(entries.slice(0, 2)).toEqual([
      [
        { label: 'JSON', value: 'json' },
        { label: 'Objeto TypeScript', value: 'typescript' },
        { label: 'Texto', value: 'text' },
      ],
      COMMAND_MESSAGES.pickProfileFormat,
    ]);
    expect(kinds).toEqual(['person', 'person']);
    expect(editor.replacements).toHaveLength(1);
    const [first, second] = editor.replacements[0] ?? [];
    expect(JSON.parse(first ?? '')).toHaveProperty('endereco.uf', 'SP');
    expect(second).not.toBe(first);
  });

  it('copies the profile when no editor is open', async () => {
    const { command, copied, notifier } = setup(['text', undefined], undefined);
    await command.execute();
    await command.execute();
    expect(copied).toHaveLength(1);
    expect(copied[0]).toMatch(/^Nome: /);
    expect(notifier.infos).toEqual([COMMAND_MESSAGES.profileCopied('Pessoa')]);
  });
});

import type { GeneratorId } from '../../application/generation/generatorIds';
import type { GeneratorGroup } from '../../shared/generatorCatalog';
import { GENERATOR_LABELS } from '../../shared/generatorCatalog';
import type { IQuickPick, PickEntry } from '../types';
import { COMMAND_MESSAGES } from './messages';
import type { ICommand } from './types';

export type GenerateById = (id: GeneratorId) => Promise<void>;

export const toPickEntries = (groups: readonly GeneratorGroup[]): PickEntry<GeneratorId>[] =>
  groups.flatMap((group) => [{ separator: group.label }, ...group.ids.map((id) => ({ label: GENERATOR_LABELS[id], value: id }))]);

export class PickGeneratorCommand implements ICommand {
  constructor(
    readonly id: string,
    private readonly picker: IQuickPick,
    private readonly groups: readonly GeneratorGroup[],
    private readonly generate: GenerateById,
  ) {}

  async execute(): Promise<void> {
    const choice = await this.picker.pick(toPickEntries(this.groups), COMMAND_MESSAGES.pickGenerator);
    if (choice !== undefined) {
      await this.generate(choice);
    }
  }
}

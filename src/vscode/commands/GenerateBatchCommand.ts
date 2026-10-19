import type { BatchRequest, BatchSource } from '../../application/batch/types';
import { SOURCE_LABELS } from '../../presentation/batchColumns';
import { BATCH_FORMAT_LABELS, BATCH_FORMATS } from '../../presentation/batchExporters';
import { isValidBatchCount, MAX_BATCH_COUNT, MIN_BATCH_COUNT, toBatchRequest, validTemplates } from '../../presentation/batchRequest';
import { describeBatchIssue } from '../../presentation/messages';
import type { GeneratorGroup } from '../../shared/generatorCatalog';
import { GENERATOR_LABELS } from '../../shared/generatorCatalog';
import type { IBatchRunner } from '../batch/BatchRunner';
import type { IInputPrompt, INotifier, IQuickPick, ISettings, PickEntry } from '../types';
import { COMMAND_MESSAGES } from './messages';
import type { ICommand } from './types';

export type BatchChoice = { readonly template: BatchRequest } | { readonly source: BatchSource };

export interface GenerateBatchDependencies {
  readonly picker: IQuickPick;
  readonly prompt: IInputPrompt;
  readonly settings: ISettings;
  readonly runner: IBatchRunner;
  readonly notifier: INotifier;
  readonly groups: readonly GeneratorGroup[];
}

const DEFAULT_COUNT = '10';

const COUNT_ISSUE = describeBatchIssue({ code: 'invalid-count', min: MIN_BATCH_COUNT, max: MAX_BATCH_COUNT });

export class GenerateBatchCommand implements ICommand {
  constructor(
    readonly id: string,
    private readonly dependencies: GenerateBatchDependencies,
  ) {}

  async execute(): Promise<void> {
    const { picker, prompt, settings, runner, notifier } = this.dependencies;
    const choice = await picker.pick(this.entries(), COMMAND_MESSAGES.pickBatchSource);
    if (choice === undefined) {
      return;
    }
    if ('template' in choice) {
      await runner.run(choice.template);
      return;
    }
    const count = await prompt.ask({
      title: COMMAND_MESSAGES.batchCountTitle,
      placeholder: DEFAULT_COUNT,
      value: DEFAULT_COUNT,
      feedback: (text) => (isValidBatchCount(text) ? undefined : { valid: false, message: COUNT_ISSUE }),
    });
    if (count === undefined) {
      return;
    }
    const format = await picker.pick(
      BATCH_FORMATS.map((value) => ({ label: BATCH_FORMAT_LABELS[value], value })),
      COMMAND_MESSAGES.pickBatchFormat,
    );
    if (format === undefined) {
      return;
    }
    const { request, issues } = toBatchRequest({ source: choice.source, count, format, formatted: settings.generateFormatted });
    if (request === undefined) {
      notifier.warn(issues.map(describeBatchIssue).join(' '));
      return;
    }
    await runner.run(request);
  }

  private entries(): PickEntry<BatchChoice>[] {
    const templates = validTemplates(this.dependencies.settings.batchTemplates);
    return [
      ...(templates.length === 0 ? [] : [{ separator: COMMAND_MESSAGES.batchTemplates }, ...templates.map(({ name, request }) => ({ label: name, value: { template: request } }))]),
      { separator: COMMAND_MESSAGES.batchProfiles },
      { label: SOURCE_LABELS.person, value: { source: 'person' } },
      { label: SOURCE_LABELS.company, value: { source: 'company' } },
      ...this.dependencies.groups.flatMap((group) => [{ separator: group.label }, ...group.ids.map((id) => ({ label: GENERATOR_LABELS[id], value: { source: id } }))]),
    ];
  }
}

import type { BatchGenerator } from '../../application/batch/BatchGenerator';
import type { BatchRequest } from '../../application/batch/types';
import { renderBatch } from '../../presentation/batchExporters';
import { COMMAND_MESSAGES } from '../commands/messages';
import type { IDocumentOpener, INotifier } from '../types';

export interface IBatchRunner {
  run(request: BatchRequest): Promise<void>;
}

export class BatchRunner implements IBatchRunner {
  constructor(
    private readonly batch: BatchGenerator,
    private readonly opener: IDocumentOpener,
    private readonly notifier: INotifier,
  ) {}

  async run(request: BatchRequest): Promise<void> {
    const { content, language } = renderBatch(this.batch.generate(request), request);
    await this.opener.open(content, language);
    this.notifier.status(COMMAND_MESSAGES.batchGenerated(request.count));
  }
}

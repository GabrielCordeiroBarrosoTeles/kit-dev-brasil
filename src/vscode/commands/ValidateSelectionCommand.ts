import type { TextInspector } from '../../application/inspection/TextInspector';
import { summarizeCandidates } from '../../presentation/candidateSummary';
import type { InspectionRenderer } from '../../presentation/InspectionRenderer';
import type { IEditor, IEditorProvider, INotifier } from '../types';
import { EditorCommand } from './EditorCommand';
import { COMMAND_MESSAGES } from './messages';

export class ValidateSelectionCommand extends EditorCommand {
  constructor(
    id: string,
    private readonly inspector: TextInspector,
    private readonly renderer: InspectionRenderer,
    editors: IEditorProvider,
    notifier: INotifier,
  ) {
    super(id, editors, notifier);
  }

  protected async run(editor: IEditor): Promise<void> {
    const texts = this.nonEmptySelections(editor);
    if (texts.length === 0) {
      this.notifier.warn(COMMAND_MESSAGES.noSelection);
      return;
    }
    await this.notifier.info(texts.map((text) => this.describe(text.trim())).join(' · '));
  }

  private describe(text: string): string {
    const summary = summarizeCandidates(this.inspector.inspectCandidates(text), this.renderer);
    return summary.valid === undefined ? COMMAND_MESSAGES.notADocument(text) : summary.message;
  }
}

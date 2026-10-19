import type { TokenScanner } from '../../application/scanning/TokenScanner';
import type { IEditor, IEditorProvider, INotifier } from '../types';
import { EditorCommand } from './EditorCommand';
import { firstSelection, pixAtCursor } from './editorText';
import { COMMAND_MESSAGES } from './messages';
import type { PixReport } from './PixReport';

export class InspectPixCommand extends EditorCommand {
  constructor(
    id: string,
    private readonly scanner: TokenScanner,
    private readonly report: PixReport,
    editors: IEditorProvider,
    notifier: INotifier,
  ) {
    super(id, editors, notifier);
  }

  protected async run(editor: IEditor): Promise<void> {
    const text = firstSelection(editor) ?? pixAtCursor(editor, this.scanner);
    if (text === undefined) {
      this.notifier.warn(COMMAND_MESSAGES.noPix);
      return;
    }
    await this.report.present(text);
  }
}

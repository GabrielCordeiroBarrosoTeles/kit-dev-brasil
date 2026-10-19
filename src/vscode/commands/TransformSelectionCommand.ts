import type { IEditor, IEditorProvider, INotifier } from '../types';
import { EditorCommand } from './EditorCommand';
import { COMMAND_MESSAGES } from './messages';

export type TextTransform = (text: string) => string | undefined;

export class TransformSelectionCommand extends EditorCommand {
  constructor(
    id: string,
    private readonly transform: TextTransform,
    private readonly nothingChangedMessage: string,
    editors: IEditorProvider,
    notifier: INotifier,
  ) {
    super(id, editors, notifier);
  }

  protected async run(editor: IEditor): Promise<void> {
    if (this.nonEmptySelections(editor).length === 0) {
      this.notifier.warn(COMMAND_MESSAGES.noSelection);
      return;
    }
    const replacements = editor.selectedTexts().map((text) => this.transform(text.trim()));
    if (replacements.every((replacement) => replacement === undefined)) {
      this.notifier.warn(this.nothingChangedMessage);
      return;
    }
    await editor.replaceSelections(replacements);
  }
}

import type { IEditor, IEditorProvider, INotifier } from '../types';
import { COMMAND_MESSAGES } from './messages';
import type { ICommand } from './types';

export abstract class EditorCommand implements ICommand {
  constructor(
    readonly id: string,
    private readonly editors: IEditorProvider,
    protected readonly notifier: INotifier,
  ) {}

  async execute(): Promise<void> {
    const editor = this.editors.active();
    if (!editor) {
      this.notifier.warn(COMMAND_MESSAGES.noEditor);
      return;
    }
    await this.run(editor);
  }

  protected abstract run(editor: IEditor): Promise<void>;

  protected nonEmptySelections(editor: IEditor): readonly string[] {
    return editor.selectedTexts().filter((text) => text.trim() !== '');
  }
}

import type { DocumentGenerator } from '../../application/generation/DocumentGenerator';
import type { IEditor, IEditorProvider, INotifier, ISettings } from '../types';
import { EditorCommand } from './EditorCommand';

export class GenerateDocumentCommand<Id extends string> extends EditorCommand {
  constructor(
    id: string,
    private readonly generatorId: Id,
    private readonly generator: DocumentGenerator<Id>,
    private readonly settings: ISettings,
    editors: IEditorProvider,
    notifier: INotifier,
  ) {
    super(id, editors, notifier);
  }

  protected async run(editor: IEditor): Promise<void> {
    const formatted = this.settings.generateFormatted;
    await editor.replaceSelections(editor.selectedTexts().map(() => this.generator.generate(this.generatorId, formatted)));
  }
}

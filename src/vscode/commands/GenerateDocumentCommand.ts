import type { DocumentGenerator } from '../../application/generation/DocumentGenerator';
import type { IClipboard, IEditor, IEditorProvider, INotifier, ISettings } from '../types';
import { EditorCommand } from './EditorCommand';
import { COMMAND_MESSAGES } from './messages';

export class GenerateDocumentCommand<Id extends string> extends EditorCommand {
  constructor(
    id: string,
    private readonly generatorId: Id,
    private readonly generator: DocumentGenerator<Id>,
    private readonly settings: ISettings,
    private readonly clipboard: IClipboard,
    editors: IEditorProvider,
    notifier: INotifier,
  ) {
    super(id, editors, notifier);
  }

  protected async run(editor: IEditor): Promise<void> {
    const formatted = this.settings.generateFormatted;
    await editor.replaceSelections(editor.selectedTexts().map(() => this.generator.generate(this.generatorId, formatted)));
  }

  protected override async runWithoutEditor(): Promise<void> {
    const value = this.generator.generate(this.generatorId, this.settings.generateFormatted);
    await this.clipboard.writeText(value);
    await this.notifier.info(COMMAND_MESSAGES.copied(this.generator.label(this.generatorId), value));
  }
}

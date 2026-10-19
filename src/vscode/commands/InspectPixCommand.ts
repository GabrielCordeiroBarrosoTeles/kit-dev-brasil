import type { BrCodeDecoder } from '../../application/inspection/TextInspector';
import type { TokenScanner } from '../../application/scanning/TokenScanner';
import type { InspectionRenderer } from '../../presentation/InspectionRenderer';
import type { IClipboard, IEditor, IEditorProvider, IMarkdownPresenter, INotifier } from '../types';
import { EditorCommand } from './EditorCommand';
import { COMMAND_MESSAGES } from './messages';

export interface InspectPixServices {
  readonly scanner: TokenScanner;
  readonly decode: BrCodeDecoder;
  readonly renderer: InspectionRenderer;
  readonly presenter: IMarkdownPresenter;
  readonly clipboard: IClipboard;
}

export class InspectPixCommand extends EditorCommand {
  constructor(
    id: string,
    private readonly services: InspectPixServices,
    editors: IEditorProvider,
    notifier: INotifier,
  ) {
    super(id, editors, notifier);
  }

  protected async run(editor: IEditor): Promise<void> {
    const text = this.findPix(editor);
    if (text === undefined) {
      this.notifier.warn(COMMAND_MESSAGES.noPix);
      return;
    }
    const decoding = this.services.decode(text);
    await this.services.presenter.show(this.services.renderer.render({ kind: 'pix', decoding }));
    const choice = await this.notifier.info(COMMAND_MESSAGES.pixInspected, COMMAND_MESSAGES.copyJson);
    if (choice === COMMAND_MESSAGES.copyJson) {
      await this.services.clipboard.writeText(JSON.stringify(decoding, null, 2));
      await this.notifier.info(COMMAND_MESSAGES.jsonCopied);
    }
  }

  private findPix(editor: IEditor): string | undefined {
    const [selected] = this.nonEmptySelections(editor);
    if (selected !== undefined) {
      return selected.trim();
    }
    const { text, column } = editor.cursorLine();
    const token = this.services.scanner.findAt(text, column);
    return token?.kind === 'pix' ? token.text : undefined;
  }
}

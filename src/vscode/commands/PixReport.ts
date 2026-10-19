import type { BrCodeDecoder } from '../../application/inspection/TextInspector';
import type { InspectionRenderer } from '../../presentation/InspectionRenderer';
import type { IClipboard, IMarkdownPresenter, INotifier } from '../types';
import { COMMAND_MESSAGES } from './messages';

export interface PixReportServices {
  readonly decode: BrCodeDecoder;
  readonly renderer: InspectionRenderer;
  readonly presenter: IMarkdownPresenter;
  readonly clipboard: IClipboard;
  readonly notifier: INotifier;
}

export class PixReport {
  constructor(private readonly services: PixReportServices) {}

  summarize(text: string): string {
    return this.services.renderer.summarizePix(this.services.decode(text));
  }

  isValid(text: string): boolean {
    return this.services.decode(text).issues.length === 0;
  }

  async present(text: string): Promise<void> {
    const { decode, renderer, presenter, clipboard, notifier } = this.services;
    const decoding = decode(text);
    await presenter.show(renderer.render({ kind: 'pix', decoding }));
    const choice = await notifier.info(COMMAND_MESSAGES.pixInspected, COMMAND_MESSAGES.copyJson);
    if (choice === COMMAND_MESSAGES.copyJson) {
      await clipboard.writeText(JSON.stringify(decoding, null, 2));
      await notifier.info(COMMAND_MESSAGES.jsonCopied);
    }
  }
}

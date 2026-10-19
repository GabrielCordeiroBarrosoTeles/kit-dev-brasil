import type { TextInspector } from '../../application/inspection/TextInspector';
import type { TokenScanner } from '../../application/scanning/TokenScanner';
import type { InspectionRenderer } from '../../presentation/InspectionRenderer';
import type { IClipboard, IEditorProvider, IInputPrompt, INotifier, InputFeedback } from '../types';
import { firstSelection, pixAtCursor } from './editorText';
import { COMMAND_MESSAGES } from './messages';
import type { PixReport } from './PixReport';
import type { ICommand } from './types';

export interface ValidateInputServices {
  readonly inspector: TextInspector;
  readonly renderer: InspectionRenderer;
  readonly prompt: IInputPrompt;
  readonly editors: IEditorProvider;
  readonly clipboard: IClipboard;
  readonly notifier: INotifier;
}

export class ValidateInputCommand implements ICommand {
  constructor(
    readonly id: string,
    private readonly services: ValidateInputServices,
  ) {}

  async execute(): Promise<void> {
    const { prompt, editors, inspector, renderer, clipboard, notifier } = this.services;
    const text = await prompt.ask({
      title: COMMAND_MESSAGES.validateTitle,
      placeholder: COMMAND_MESSAGES.validatePlaceholder,
      value: firstSelection(editors.active()) ?? '',
      feedback: (value) => this.feedback(value),
    });
    const inspection = text === undefined ? undefined : inspector.inspectDocument(text.trim());
    if (text === undefined || text.trim() === '') {
      return;
    }
    if (!inspection) {
      notifier.warn(COMMAND_MESSAGES.notADocument(text.trim()));
      return;
    }
    const choice = await notifier.info(renderer.summarize(inspection), COMMAND_MESSAGES.copyFormatted);
    if (choice === COMMAND_MESSAGES.copyFormatted) {
      await clipboard.writeText(inspection.formatted);
      notifier.status(COMMAND_MESSAGES.formattedCopied(inspection.formatted));
    }
  }

  private feedback(value: string): InputFeedback | undefined {
    const text = value.trim();
    if (text === '') {
      return undefined;
    }
    const inspection = this.services.inspector.inspectDocument(text);
    if (!inspection) {
      return { valid: false, message: COMMAND_MESSAGES.notADocumentShort };
    }
    return { valid: inspection.validation.valid, message: this.services.renderer.summarize(inspection) };
  }
}

export interface InspectPixInputServices {
  readonly scanner: TokenScanner;
  readonly report: PixReport;
  readonly prompt: IInputPrompt;
  readonly editors: IEditorProvider;
}

export class InspectPixInputCommand implements ICommand {
  constructor(
    readonly id: string,
    private readonly services: InspectPixInputServices,
  ) {}

  async execute(): Promise<void> {
    const { prompt, editors, scanner, report } = this.services;
    const editor = editors.active();
    const text = await prompt.ask({
      title: COMMAND_MESSAGES.pixTitle,
      placeholder: COMMAND_MESSAGES.pixPlaceholder,
      value: firstSelection(editor) ?? pixAtCursor(editor, scanner) ?? '',
      feedback: (value) => (value.trim() === '' ? undefined : { valid: report.isValid(value), message: report.summarize(value) }),
    });
    if (text !== undefined && text.trim() !== '') {
      await report.present(text.trim());
    }
  }
}

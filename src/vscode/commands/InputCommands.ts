import type { TextInspector } from '../../application/inspection/TextInspector';
import type { TokenScanner } from '../../application/scanning/TokenScanner';
import { summarizeCandidates } from '../../presentation/candidateSummary';
import type { CandidateSummary } from '../../presentation/candidateSummary';
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
    const { prompt, editors, clipboard, notifier } = this.services;
    const text = await prompt.ask({
      title: COMMAND_MESSAGES.validateTitle,
      placeholder: COMMAND_MESSAGES.validatePlaceholder,
      value: firstSelection(editors.active()) ?? '',
      feedback: (value) => this.feedback(value),
    });
    const trimmed = text?.trim() ?? '';
    if (trimmed === '') {
      return;
    }
    const summary = this.summarize(trimmed);
    if (summary.valid === undefined) {
      notifier.warn(COMMAND_MESSAGES.notADocument(trimmed));
      return;
    }
    const { formatted } = summary;
    const choice = await notifier.info(summary.message, ...(formatted === undefined ? [] : [COMMAND_MESSAGES.copyFormatted]));
    if (choice === COMMAND_MESSAGES.copyFormatted && formatted !== undefined) {
      await clipboard.writeText(formatted);
      notifier.status(COMMAND_MESSAGES.formattedCopied(formatted));
    }
  }

  private summarize(text: string): CandidateSummary {
    return summarizeCandidates(this.services.inspector.inspectCandidates(text), this.services.renderer);
  }

  private feedback(value: string): InputFeedback | undefined {
    const text = value.trim();
    if (text === '') {
      return undefined;
    }
    const { valid, message } = this.summarize(text);
    return { valid: valid === true, message };
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

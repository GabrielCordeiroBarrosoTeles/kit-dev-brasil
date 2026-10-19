export interface CursorLine {
  readonly text: string;
  readonly column: number;
}

export interface IEditor {
  selectedTexts(): readonly string[];
  cursorLine(): CursorLine;
  replaceSelections(replacements: readonly (string | undefined)[]): Promise<void>;
}

export interface IEditorProvider {
  active(): IEditor | undefined;
}

export interface ISettings {
  readonly generateFormatted: boolean;
  readonly hoverEnabled: boolean;
  setGenerateFormatted(value: boolean): Promise<void>;
}

export interface INotifier {
  info(message: string, ...actions: string[]): Promise<string | undefined>;
  warn(message: string): void;
  status(message: string): void;
}

export interface IMarkdownPresenter {
  show(content: string): Promise<void>;
}

export interface IClipboard {
  writeText(text: string): Promise<void>;
}

export interface InputFeedback {
  readonly valid: boolean;
  readonly message: string;
}

export interface InputRequest {
  readonly title: string;
  readonly placeholder: string;
  readonly value: string;
  readonly feedback: (text: string) => InputFeedback | undefined;
}

export interface IInputPrompt {
  ask(request: InputRequest): Promise<string | undefined>;
}

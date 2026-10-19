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
}

export interface INotifier {
  info(message: string, ...actions: string[]): Promise<string | undefined>;
  warn(message: string): void;
}

export interface IMarkdownPresenter {
  show(content: string): Promise<void>;
}

export interface IClipboard {
  writeText(text: string): Promise<void>;
}

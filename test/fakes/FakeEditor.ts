import type { CursorLine, IEditor, IEditorProvider, INotifier } from '../../src/vscode/types';

export class FakeEditor implements IEditor {
  replacements: (readonly (string | undefined)[])[] = [];

  constructor(
    private readonly texts: readonly string[] = [''],
    private readonly line: CursorLine = { text: '', column: 0 },
  ) {}

  selectedTexts(): readonly string[] {
    return this.texts;
  }

  cursorLine(): CursorLine {
    return this.line;
  }

  replaceSelections(replacements: readonly (string | undefined)[]): Promise<void> {
    this.replacements.push(replacements);
    return Promise.resolve();
  }
}

export const editorProvider = (editor: IEditor | undefined): IEditorProvider => ({ active: () => editor });

export class FakeNotifier implements INotifier {
  readonly infos: string[] = [];
  readonly warnings: string[] = [];

  constructor(private readonly choice: string | undefined = undefined) {}

  info(message: string): Promise<string | undefined> {
    this.infos.push(message);
    return Promise.resolve(this.choice);
  }

  warn(message: string): void {
    this.warnings.push(message);
  }
}

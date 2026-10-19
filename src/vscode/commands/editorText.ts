import type { TokenScanner } from '../../application/scanning/TokenScanner';
import type { IEditor } from '../types';

export const firstSelection = (editor: IEditor | undefined): string | undefined =>
  editor
    ?.selectedTexts()
    .map((text) => text.trim())
    .find((text) => text !== '');

export const pixAtCursor = (editor: IEditor | undefined, scanner: TokenScanner): string | undefined => {
  if (!editor) {
    return undefined;
  }
  const { text, column } = editor.cursorLine();
  const token = scanner.findAt(text, column);
  return token?.kind === 'pix' ? token.text : undefined;
};

import * as vscode from 'vscode';
import type { TextInspector } from '../application/inspection/TextInspector';
import type { TokenScanner } from '../application/scanning/TokenScanner';
import type { InspectionRenderer } from '../presentation/InspectionRenderer';
import type { ISettings } from './types';

export class KitHoverProvider implements vscode.HoverProvider {
  constructor(
    private readonly scanner: TokenScanner,
    private readonly inspector: TextInspector,
    private readonly renderer: InspectionRenderer,
    private readonly settings: ISettings,
  ) {}

  provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.Hover | undefined {
    if (!this.settings.hoverEnabled) {
      return undefined;
    }
    const token = this.scanner.findAt(document.lineAt(position.line).text, position.character);
    const inspection = token && this.inspector.inspect(token);
    if (!token || !inspection || !this.inspector.shouldDisplay(token, inspection)) {
      return undefined;
    }
    const range = new vscode.Range(position.line, token.start, position.line, token.end);
    return new vscode.Hover(new vscode.MarkdownString(this.renderer.render(inspection)), range);
  }
}

import * as vscode from 'vscode';
import type { ICommand } from './types';

export const registerCommands = (commands: readonly ICommand[]): vscode.Disposable[] =>
  commands.map((command) => vscode.commands.registerCommand(command.id, () => command.execute()));

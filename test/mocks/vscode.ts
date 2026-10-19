import { vi } from 'vitest';

export class Range {
  constructor(
    readonly startLine: number,
    readonly startCharacter: number,
    readonly endLine: number,
    readonly endCharacter: number,
  ) {}
}

export class MarkdownString {
  constructor(readonly value: string) {}
}

export class Hover {
  constructor(
    readonly contents: MarkdownString,
    readonly range: Range,
  ) {}
}

export const ViewColumn = { Beside: -2 } as const;

export const configuration = new Map<string, unknown>();

export const commandHandlers = new Map<string, () => unknown>();

const disposable = () => ({ dispose: vi.fn() });

export const window = {
  activeTextEditor: undefined as unknown,
  showInformationMessage: vi.fn((_message: string, ..._actions: string[]) => Promise.resolve<string | undefined>(undefined)),
  showWarningMessage: vi.fn((_message: string) => Promise.resolve(undefined)),
  showTextDocument: vi.fn((_document: unknown, _options: unknown) => Promise.resolve(undefined)),
};

export const workspace = {
  getConfiguration: vi.fn((section: string) => ({
    get: <T>(key: string, fallback: T): T => (configuration.has(`${section}.${key}`) ? (configuration.get(`${section}.${key}`) as T) : fallback),
  })),
  openTextDocument: vi.fn((options: { language: string; content: string }) => Promise.resolve({ uri: 'untitled:1', ...options })),
};

export const env = {
  clipboard: { writeText: vi.fn((_text: string) => Promise.resolve()) },
};

export const commands = {
  registerCommand: vi.fn((id: string, handler: () => unknown) => {
    commandHandlers.set(id, handler);
    return disposable();
  }),
};

export const languages = {
  registerHoverProvider: vi.fn((_selector: unknown, _provider: unknown) => disposable()),
};

export const resetVscodeMock = (): void => {
  window.activeTextEditor = undefined;
  configuration.clear();
  commandHandlers.clear();
};

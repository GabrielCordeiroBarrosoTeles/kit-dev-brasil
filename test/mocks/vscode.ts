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

export const InputBoxValidationSeverity = { Info: 1, Warning: 2, Error: 3 } as const;

export const TreeItemCollapsibleState = { None: 0, Collapsed: 1, Expanded: 2 } as const;

export class ThemeIcon {
  constructor(readonly id: string) {}
}

export class TreeItem {
  description?: string;
  tooltip?: string;
  iconPath?: ThemeIcon;
  command?: { command: string; title: string };

  constructor(
    readonly label: string,
    readonly collapsibleState: number,
  ) {}
}

export class EventEmitter<T> {
  private readonly listeners = new Set<(value: T) => void>();
  disposed = false;

  readonly event = (listener: (value: T) => void) => {
    this.listeners.add(listener);
    return { dispose: () => this.listeners.delete(listener) };
  };

  fire(value: T): void {
    this.listeners.forEach((listener) => listener(value));
  }

  dispose(): void {
    this.disposed = true;
    this.listeners.clear();
  }
}

export const configuration = new Map<string, unknown>();

export const configurationUpdates: unknown[][] = [];

export const ConfigurationTarget = { Global: 1, Workspace: 2 } as const;

export class Uri {
  constructor(readonly path: string) {}

  static joinPath(base: Uri, ...segments: string[]): Uri {
    return new Uri([base.path, ...segments].join('/'));
  }

  toString(): string {
    return `webview:${this.path}`;
  }
}

export const commandHandlers = new Map<string, (argument?: unknown) => unknown>();

const disposable = () => ({ dispose: vi.fn() });

export const window = {
  activeTextEditor: undefined as unknown,
  showInformationMessage: vi.fn((_message: string, ..._actions: string[]) => Promise.resolve<string | undefined>(undefined)),
  showWarningMessage: vi.fn((_message: string) => Promise.resolve(undefined)),
  showTextDocument: vi.fn((_document: unknown, _options: unknown) => Promise.resolve(undefined)),
  registerTreeDataProvider: vi.fn((_id: string, _provider: unknown) => disposable()),
  registerWebviewViewProvider: vi.fn((_id: string, _provider: unknown) => disposable()),
  setStatusBarMessage: vi.fn((_message: string, _timeout: number) => disposable()),
  showInputBox: vi.fn((_options: { validateInput: (text: string) => unknown }) => Promise.resolve<string | undefined>(undefined)),
};

export const workspace = {
  getConfiguration: vi.fn((section: string) => ({
    get: <T>(key: string, fallback: T): T => (configuration.has(`${section}.${key}`) ? (configuration.get(`${section}.${key}`) as T) : fallback),
    update: (key: string, value: unknown, target: number) => {
      configurationUpdates.push([section, key, value, target]);
      return Promise.resolve();
    },
  })),
  openTextDocument: vi.fn((options: { language: string; content: string }) => Promise.resolve({ uri: 'untitled:1', ...options })),
};

export const env = {
  clipboard: { writeText: vi.fn((_text: string) => Promise.resolve()) },
};

export const commands = {
  registerCommand: vi.fn((id: string, handler: (argument?: unknown) => unknown) => {
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
  configurationUpdates.length = 0;
  commandHandlers.clear();
};

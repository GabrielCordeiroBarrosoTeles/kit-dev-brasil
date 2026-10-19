import type { GeneratorId } from '../application/generation/generatorIds';

export type ResultState = 'empty' | 'valid' | 'invalid' | 'unknown';

export type FieldRow = readonly [label: string, value: string];

export interface DocumentView {
  readonly state: ResultState;
  readonly message: string;
  readonly formatted: string | undefined;
}

export interface PixView {
  readonly state: ResultState;
  readonly summary: string;
  readonly fields: readonly FieldRow[];
  readonly issues: readonly string[];
}

export interface SidebarState {
  readonly generated: Readonly<Record<GeneratorId, string | undefined>>;
  readonly formatted: boolean;
}

export interface GeneratorEntry {
  readonly id: GeneratorId;
  readonly label: string;
}

export const SIDEBAR_GENERATORS: readonly GeneratorEntry[] = [
  { id: 'cpf', label: 'CPF' },
  { id: 'cnpj', label: 'CNPJ' },
  { id: 'alphanumericCnpj', label: 'CNPJ alfanumérico' },
];

export type HostToSidebarMessage =
  | { readonly type: 'state'; readonly state: SidebarState }
  | { readonly type: 'document-result'; readonly view: DocumentView }
  | { readonly type: 'pix-result'; readonly view: PixView };

export type SidebarToHostMessage =
  | { readonly type: 'ready' }
  | { readonly type: 'generate'; readonly id: GeneratorId }
  | { readonly type: 'copy-generated'; readonly id: GeneratorId }
  | { readonly type: 'set-formatted'; readonly value: boolean }
  | { readonly type: 'validate'; readonly text: string }
  | { readonly type: 'copy-formatted'; readonly text: string }
  | { readonly type: 'inspect-pix'; readonly text: string }
  | { readonly type: 'open-pix-report'; readonly text: string }
  | { readonly type: 'copy-pix-json'; readonly text: string }
  | { readonly type: 'format-selection' }
  | { readonly type: 'unformat-selection' };

import type { GeneratorId } from '../application/generation/generatorIds';
import type { PixForm } from '../application/pix/generateStaticPix';

export type ResultState = 'empty' | 'valid' | 'invalid' | 'unknown';

export type FieldRow = readonly [label: string, value: string];

export interface DocumentView {
  readonly state: ResultState;
  readonly message: string;
  readonly formatted: string | undefined;
}

export interface InspectionView {
  readonly state: ResultState;
  readonly summary: string;
  readonly fields: readonly FieldRow[];
  readonly issues: readonly string[];
}

export type PixView = InspectionView;

export type BoletoView = InspectionView;

export type BoletoFormatChoice = 'barcode' | 'line';

export interface PixGeneratedView {
  readonly code: string | undefined;
  readonly qrDataUrl: string | undefined;
  readonly issues: readonly string[];
}

export interface SidebarState {
  readonly generated: Readonly<Record<GeneratorId, string | undefined>>;
  readonly formatted: boolean;
}

export type HostToSidebarMessage =
  | { readonly type: 'state'; readonly state: SidebarState }
  | { readonly type: 'document-result'; readonly view: DocumentView }
  | { readonly type: 'pix-result'; readonly view: PixView }
  | { readonly type: 'boleto-result'; readonly view: BoletoView }
  | { readonly type: 'pix-generated'; readonly view: PixGeneratedView };

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
  | { readonly type: 'inspect-boleto'; readonly text: string }
  | { readonly type: 'generate-pix'; readonly form: PixForm }
  | { readonly type: 'copy-text'; readonly text: string }
  | { readonly type: 'copy-boleto'; readonly text: string; readonly format: BoletoFormatChoice }
  | { readonly type: 'format-selection' }
  | { readonly type: 'unformat-selection' };

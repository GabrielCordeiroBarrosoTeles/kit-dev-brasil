import type { BoletoDecoding } from '../../domain/boleto/types';
import type { DocumentKind, DocumentValidation } from '../../domain/documents/types';
import type { BrCodeDecoding } from '../../domain/pix/types';

export interface DocumentInspection {
  readonly kind: 'document';
  readonly document: DocumentKind;
  readonly label: string;
  readonly formatted: string;
  readonly details: string | undefined;
  readonly validation: DocumentValidation;
}

export interface PixInspection {
  readonly kind: 'pix';
  readonly decoding: BrCodeDecoding;
}

export interface BoletoInspection {
  readonly kind: 'boleto';
  readonly decoding: BoletoDecoding;
}

export type Inspection = DocumentInspection | PixInspection | BoletoInspection;

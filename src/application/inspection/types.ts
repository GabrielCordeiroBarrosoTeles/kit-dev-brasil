import type { DocumentKind, DocumentValidation } from '../../domain/documents/types';
import type { BrCodeDecoding } from '../../domain/pix/types';

export interface DocumentInspection {
  readonly kind: 'document';
  readonly document: DocumentKind;
  readonly label: string;
  readonly formatted: string;
  readonly validation: DocumentValidation;
}

export interface PixInspection {
  readonly kind: 'pix';
  readonly decoding: BrCodeDecoding;
}

export type Inspection = DocumentInspection | PixInspection;

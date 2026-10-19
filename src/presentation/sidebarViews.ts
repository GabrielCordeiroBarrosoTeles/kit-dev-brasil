import type { DocumentInspection } from '../application/inspection/types';
import type { BrCodeDecoding } from '../domain/pix/types';
import type { DocumentView, PixView } from '../shared/sidebarProtocol';
import type { InspectionRenderer } from './InspectionRenderer';
import { describeBrCodeIssue } from './messages';
import { describePixFields } from './pixFields';

export const NOT_A_DOCUMENT = 'Não parece um CPF ou CNPJ';

export const EMPTY_DOCUMENT_VIEW: DocumentView = { state: 'empty', message: '', formatted: undefined };

export const EMPTY_PIX_VIEW: PixView = { state: 'empty', summary: '', fields: [], issues: [] };

export const toDocumentView = (inspection: DocumentInspection | undefined, renderer: InspectionRenderer): DocumentView => {
  if (!inspection) {
    return { state: 'unknown', message: NOT_A_DOCUMENT, formatted: undefined };
  }
  return { state: inspection.validation.valid ? 'valid' : 'invalid', message: renderer.summarize(inspection), formatted: inspection.formatted };
};

export const toPixView = (decoding: BrCodeDecoding, renderer: InspectionRenderer): PixView => ({
  state: decoding.issues.length === 0 ? 'valid' : 'invalid',
  summary: renderer.summarizePix(decoding),
  fields: decoding.brCode ? describePixFields(decoding.brCode) : [],
  issues: decoding.issues.map(describeBrCodeIssue),
});

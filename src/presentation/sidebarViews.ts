import type { DocumentInspection } from '../application/inspection/types';
import { summarizeCandidates } from './candidateSummary';
import type { BoletoDecoding } from '../domain/boleto/types';
import type { BrCodeDecoding } from '../domain/pix/types';
import type { BoletoView, DocumentView, InspectionView, PixView } from '../shared/sidebarProtocol';
import type { InspectionRenderer } from './InspectionRenderer';
import { describeBoletoIssue, describeBrCodeIssue } from './messages';
import { describePixFields } from './pixFields';

export const EMPTY_DOCUMENT_VIEW: DocumentView = { state: 'empty', message: '', formatted: undefined };

export const EMPTY_INSPECTION_VIEW: InspectionView = { state: 'empty', summary: '', fields: [], issues: [] };

export const toDocumentView = (inspections: readonly DocumentInspection[], renderer: InspectionRenderer): DocumentView => {
  const { valid, message, formatted } = summarizeCandidates(inspections, renderer);
  const state = valid === undefined ? 'unknown' : valid ? 'valid' : 'invalid';
  return { state, message, formatted };
};

export const toPixView = (decoding: BrCodeDecoding, renderer: InspectionRenderer): PixView => ({
  state: decoding.issues.length === 0 ? 'valid' : 'invalid',
  summary: renderer.summarizePix(decoding),
  fields: decoding.brCode ? describePixFields(decoding.brCode) : [],
  issues: decoding.issues.map(describeBrCodeIssue),
});

export const toBoletoView = (decoding: BoletoDecoding, renderer: InspectionRenderer): BoletoView => ({
  state: decoding.issues.length === 0 ? 'valid' : 'invalid',
  summary: renderer.summarizeBoleto(decoding),
  fields: decoding.boleto ? renderer.describeBoleto(decoding.boleto) : [],
  issues: decoding.issues.map(describeBoletoIssue),
});

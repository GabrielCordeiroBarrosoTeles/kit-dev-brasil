import type { DocumentInspection } from '../application/inspection/types';
import { summarizeCandidates } from './candidateSummary';
import type { BoletoDecoding } from '../domain/boleto/types';
import type { BrCodeDecoding } from '../domain/pix/types';
import type { BatchRequest } from '../application/batch/types';
import type { BatchFormValues, BatchTemplateView, BoletoView, DocumentView, InspectionView, PixView, ProfileView } from '../shared/sidebarProtocol';
import type { NamedBatchRequest } from './batchRequest';
import type { InspectionRenderer } from './InspectionRenderer';
import { describeBoletoIssue, describeBrCodeIssue } from './messages';
import { describePixFields } from './pixFields';
import { EXPORT_FORMATS, exportProfile } from './profileExporters';
import type { ExportFormat } from './profileExporters';
import type { Profile } from './profiles';

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

export const toProfileView = (profile: Profile): ProfileView => ({
  fields: [...profile.fields, ...profile.address].map(({ label, display }) => [label, display] as const),
  exports: Object.fromEntries(EXPORT_FORMATS.map((format) => [format, exportProfile(profile, format)])) as Record<ExportFormat, string>,
});

export const toBatchFormValues = ({ source, count, state, format, seed, name, columns }: BatchRequest): BatchFormValues => ({
  source,
  count: String(count),
  state: state ?? '',
  format,
  seed: seed ?? '',
  name,
  columns,
});

export const toBatchTemplateViews = (templates: readonly NamedBatchRequest[]): readonly BatchTemplateView[] =>
  templates.map(({ name, request }) => ({ name, values: toBatchFormValues(request) }));

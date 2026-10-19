import type { DocumentInspection } from '../application/inspection/types';
import type { InspectionRenderer } from './InspectionRenderer';

export const NOT_A_DOCUMENT = 'Não parece um documento conhecido';

export interface CandidateSummary {
  readonly valid: boolean | undefined;
  readonly message: string;
  readonly formatted: string | undefined;
}

const joinLabels = (labels: readonly string[], conjunction: string): string => `${labels.slice(0, -1).join(', ')} ${conjunction} ${labels.at(-1)}`;

export const summarizeCandidates = (inspections: readonly DocumentInspection[], renderer: InspectionRenderer): CandidateSummary => {
  const valid = inspections.filter((inspection) => inspection.validation.valid);
  const [first, second] = valid;
  if (first && !second) {
    return { valid: true, message: renderer.summarize(first), formatted: first.formatted };
  }
  if (first) {
    return { valid: true, message: `Válido como ${joinLabels(valid.map((inspection) => inspection.label), 'e')}`, formatted: first.formatted };
  }
  const [only, another] = inspections;
  if (!only) {
    return { valid: undefined, message: NOT_A_DOCUMENT, formatted: undefined };
  }
  if (!another) {
    return { valid: false, message: renderer.summarize(only), formatted: only.formatted };
  }
  return { valid: false, message: `Não é válido como ${joinLabels(inspections.map((inspection) => inspection.label), 'nem')}`, formatted: undefined };
};

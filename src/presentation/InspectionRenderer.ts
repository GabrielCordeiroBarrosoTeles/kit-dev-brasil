import type { DocumentInspection, Inspection, PixInspection } from '../application/inspection/types';
import type { BrCodeDecoding } from '../domain/pix/types';
import { bulletList, escapeMarkdown, table } from './markdown';
import { describeBrCodeIssue, describeDocumentIssue } from './messages';
import { describePixFields, formatAmount } from './pixFields';

const VALID_MARK = '✅';
const INVALID_MARK = '❌';

export class InspectionRenderer {
  render(inspection: Inspection): string {
    return inspection.kind === 'pix' ? this.renderPix(inspection) : this.renderDocument(inspection);
  }

  summarize(inspection: DocumentInspection): string {
    const { label, formatted, validation } = inspection;
    return validation.valid ? `${label} ${formatted} é válido` : `${label} ${formatted} é inválido: ${describeDocumentIssue(validation.issue)}`;
  }

  summarizePix({ brCode, issues }: BrCodeDecoding): string {
    const [first, ...others] = issues;
    if (first) {
      const extra = others.length === 0 ? '' : ` (+${others.length} ${others.length === 1 ? 'problema' : 'problemas'})`;
      return `PIX inválido: ${describeBrCodeIssue(first)}${extra}`;
    }
    const amount = brCode?.amount === undefined ? 'valor livre' : formatAmount(brCode.amount);
    return brCode?.merchantName ? `PIX válido: ${amount} para ${brCode.merchantName}` : `PIX válido: ${amount}`;
  }

  private renderDocument(inspection: DocumentInspection): string {
    const mark = inspection.validation.valid ? VALID_MARK : INVALID_MARK;
    return `${mark} ${escapeMarkdown(this.summarize(inspection))}`;
  }

  private renderPix({ decoding }: PixInspection): string {
    const valid = decoding.issues.length === 0;
    const sections = [`**PIX copia-e-cola** · ${valid ? `${VALID_MARK} válido` : `${INVALID_MARK} inválido`}`];
    if (decoding.brCode) {
      sections.push(table(describePixFields(decoding.brCode).map(([label, value]) => [label, escapeMarkdown(value)] as const)));
    }
    if (!valid) {
      sections.push(bulletList(decoding.issues.map((issue) => escapeMarkdown(describeBrCodeIssue(issue)))));
    }
    return sections.join('\n\n');
  }
}

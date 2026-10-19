import type { BoletoInspection, DocumentInspection, Inspection, PixInspection } from '../application/inspection/types';
import type { Boleto, BoletoDecoding } from '../domain/boleto/types';
import type { FieldRow } from '../shared/sidebarProtocol';
import type { BrCodeDecoding } from '../domain/pix/types';
import { bulletList, escapeMarkdown, table } from './markdown';
import { describeBank, describeBoletoAmount, describeBoletoFields, describeDueDate } from './boletoFields';
import { describeBoletoIssue, describeBrCodeIssue, describeDocumentIssue } from './messages';
import { describePixFields, formatAmount } from './pixFields';

const VALID_MARK = '✅';
const INVALID_MARK = '❌';

const issuesSuffix = (count: number): string => (count === 0 ? '' : ` (+${count} ${count === 1 ? 'problema' : 'problemas'})`);

export class InspectionRenderer {
  constructor(private readonly today: () => Date = () => new Date()) {}

  render(inspection: Inspection): string {
    switch (inspection.kind) {
      case 'pix':
        return this.renderPix(inspection);
      case 'boleto':
        return this.renderBoleto(inspection);
      case 'document':
        return this.renderDocument(inspection);
    }
  }

  summarize(inspection: DocumentInspection): string {
    const { label, formatted, details, validation } = inspection;
    if (!validation.valid) {
      return `${label} ${formatted} é inválido: ${describeDocumentIssue(validation.issue)}`;
    }
    return details === undefined ? `${label} ${formatted} é válido` : `${label} ${formatted} (${details}) é válido`;
  }

  summarizePix({ brCode, issues }: BrCodeDecoding): string {
    const [first, ...others] = issues;
    if (first) {
      return `PIX inválido: ${describeBrCodeIssue(first)}${issuesSuffix(others.length)}`;
    }
    const amount = brCode?.amount === undefined ? 'valor livre' : formatAmount(brCode.amount);
    return brCode?.merchantName ? `PIX válido: ${amount} para ${brCode.merchantName}` : `PIX válido: ${amount}`;
  }

  summarizeBoleto({ boleto, issues }: BoletoDecoding): string {
    const [first, ...others] = issues;
    if (first) {
      return `Boleto inválido: ${describeBoletoIssue(first)}${issuesSuffix(others.length)}`;
    }
    const parts = [
      boleto === undefined ? undefined : describeBoletoAmount(boleto),
      boleto?.bankCode === undefined ? undefined : describeBank(boleto.bankCode),
      boleto?.dueDate === undefined ? undefined : `vencimento ${describeDueDate(boleto.dueDate, this.today())}`,
    ].filter((part) => part !== undefined);
    return ['Boleto válido', ...parts].join(' · ');
  }

  describeBoleto(boleto: Boleto): FieldRow[] {
    return describeBoletoFields(boleto, this.today());
  }

  private renderBoleto({ decoding }: BoletoInspection): string {
    const valid = decoding.issues.length === 0;
    const sections = [`**Boleto** · ${valid ? `${VALID_MARK} válido` : `${INVALID_MARK} inválido`}`];
    if (decoding.boleto) {
      sections.push(table(this.describeBoleto(decoding.boleto).map(([label, value]) => [label, escapeMarkdown(value)] as const)));
    }
    if (!valid) {
      sections.push(bulletList(decoding.issues.map((issue) => escapeMarkdown(describeBoletoIssue(issue)))));
    }
    return sections.join('\n\n');
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

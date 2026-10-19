import type { DocumentInspection, Inspection, PixInspection } from '../application/inspection/types';
import type { BrCode } from '../domain/pix/types';
import { bulletList, escapeMarkdown, table } from './markdown';
import { describeBrCodeIssue, describeDocumentIssue, INITIATION_LABELS, KEY_TYPE_LABELS } from './messages';

const VALID_MARK = '✅';
const INVALID_MARK = '❌';
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const optional = (value: string | undefined): string | undefined => (value === undefined || value === '' ? undefined : escapeMarkdown(value));

export class InspectionRenderer {
  render(inspection: Inspection): string {
    return inspection.kind === 'pix' ? this.renderPix(inspection) : this.renderDocument(inspection);
  }

  summarize(inspection: DocumentInspection): string {
    const { label, formatted, validation } = inspection;
    return validation.valid ? `${label} ${formatted} é válido` : `${label} ${formatted} é inválido: ${describeDocumentIssue(validation.issue)}`;
  }

  private renderDocument(inspection: DocumentInspection): string {
    const mark = inspection.validation.valid ? VALID_MARK : INVALID_MARK;
    return `${mark} ${escapeMarkdown(this.summarize(inspection))}`;
  }

  private renderPix({ decoding }: PixInspection): string {
    const valid = decoding.issues.length === 0;
    const sections = [`**PIX copia-e-cola** · ${valid ? `${VALID_MARK} válido` : `${INVALID_MARK} inválido`}`];
    if (decoding.brCode) {
      sections.push(table(this.pixRows(decoding.brCode)));
    }
    if (!valid) {
      sections.push(bulletList(decoding.issues.map((issue) => escapeMarkdown(describeBrCodeIssue(issue)))));
    }
    return sections.join('\n\n');
  }

  private pixRows(brCode: BrCode): (readonly [string, string])[] {
    const rows: readonly (readonly [string, string | undefined])[] = [
      ['Chave', this.key(brCode)],
      ['URL', optional(brCode.url)],
      ['Valor', brCode.amount === undefined ? 'livre (quem paga digita)' : this.amount(brCode.amount)],
      ['Recebedor', optional(brCode.merchantName)],
      ['Cidade', optional(brCode.merchantCity)],
      ['CEP', optional(brCode.postalCode)],
      ['Descrição', optional(brCode.description)],
      ['Identificador (txid)', optional(brCode.txid)],
      ['Tipo', brCode.initiation === undefined ? undefined : INITIATION_LABELS[brCode.initiation]],
      ['CRC', optional(brCode.crc)],
    ];
    return rows.filter((row): row is readonly [string, string] => row[1] !== undefined);
  }

  private key({ key, keyType }: BrCode): string | undefined {
    const value = optional(key);
    if (value === undefined) {
      return undefined;
    }
    return keyType === undefined ? value : `${value} (${KEY_TYPE_LABELS[keyType]})`;
  }

  private amount(amount: string): string {
    const value = Number(amount);
    return Number.isFinite(value) ? currency.format(value) : escapeMarkdown(amount);
  }
}

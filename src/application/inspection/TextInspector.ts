import type { DocumentRegistry } from '../../domain/documents/DocumentRegistry';
import type { BrCodeDecoding } from '../../domain/pix/types';
import type { Token } from '../scanning/types';
import type { DocumentInspection, Inspection } from './types';

export type BrCodeDecoder = (input: string) => BrCodeDecoding;

export class TextInspector {
  constructor(
    private readonly documents: DocumentRegistry,
    private readonly decodePix: BrCodeDecoder,
  ) {}

  inspect(token: Token): Inspection | undefined {
    return token.kind === 'pix' ? { kind: 'pix', decoding: this.decodePix(token.text) } : this.inspectDocument(token.text);
  }

  inspectDocument(text: string): DocumentInspection | undefined {
    const type = this.documents.identify(text);
    if (!type) {
      return undefined;
    }
    return { kind: 'document', document: type.kind, label: type.label, formatted: type.format(text), validation: type.validate(text) };
  }

  shouldDisplay(token: Token, inspection: Inspection): boolean {
    return inspection.kind === 'pix' || token.masked || inspection.validation.valid;
  }
}

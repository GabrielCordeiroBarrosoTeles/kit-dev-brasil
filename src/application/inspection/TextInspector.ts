import type { DocumentRegistry } from '../../domain/documents/DocumentRegistry';
import type { DocumentType } from '../../domain/documents/types';
import type { BoletoDecoding } from '../../domain/boleto/types';
import type { BrCodeDecoding } from '../../domain/pix/types';
import type { Token } from '../scanning/types';
import type { DocumentInspection, Inspection } from './types';

export type BrCodeDecoder = (input: string) => BrCodeDecoding;

export type BoletoDecoder = (input: string) => BoletoDecoding;

export class TextInspector {
  constructor(
    private readonly documents: DocumentRegistry,
    private readonly decodePix: BrCodeDecoder,
    private readonly decodeBoleto: BoletoDecoder,
  ) {}

  inspect(token: Token): Inspection | undefined {
    switch (token.kind) {
      case 'pix':
        return { kind: 'pix', decoding: this.decodePix(token.text) };
      case 'boleto':
        return { kind: 'boleto', decoding: this.decodeBoleto(token.text) };
      case 'document':
        return this.inspectDocument(token.text);
    }
  }

  inspectDocument(text: string): DocumentInspection | undefined {
    const type = this.documents.identify(text);
    return type && this.inspectAs(type, text);
  }

  inspectCandidates(text: string): readonly DocumentInspection[] {
    return this.documents.candidates(text).map((type) => this.inspectAs(type, text));
  }

  private inspectAs(type: DocumentType, text: string): DocumentInspection {
    const validation = type.validate(text);
    return {
      kind: 'document',
      document: type.kind,
      label: type.label,
      formatted: type.format(text),
      details: validation.valid ? type.details?.(text) : undefined,
      validation,
    };
  }

  shouldDisplay(token: Token, inspection: Inspection): boolean {
    return inspection.kind !== 'document' || token.masked || inspection.validation.valid;
  }
}

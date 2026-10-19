import type { DocumentKind, DocumentType } from './types';

export class DocumentRegistry {
  constructor(private readonly types: readonly DocumentType[]) {}

  identify(text: string): DocumentType | undefined {
    return this.types.find((type) => type.identifies(text));
  }

  byKind(kind: DocumentKind): DocumentType | undefined {
    return this.types.find((type) => type.kind === kind);
  }
}

import type { DocumentRegistry } from '../../domain/documents/DocumentRegistry';

const MASK_CHARACTERS = /[.\-/\s()]/g;

export class TextTransformer {
  constructor(private readonly documents: DocumentRegistry) {}

  format(text: string): string | undefined {
    return this.documents.identify(text)?.format(text);
  }

  unformat(text: string): string | undefined {
    const stripped = text.replace(MASK_CHARACTERS, '');
    return stripped === text ? undefined : stripped;
  }
}

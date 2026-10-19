import type { DocumentType } from '../../domain/documents/types';
import type { RandomSource } from '../../domain/shared/types';

export interface GeneratorSpec {
  readonly type: DocumentType;
  readonly generate: (random: RandomSource) => string;
}

export class DocumentGenerator<Id extends string> {
  constructor(
    private readonly specs: Readonly<Record<Id, GeneratorSpec>>,
    private readonly random: RandomSource,
  ) {}

  generate(id: Id, formatted: boolean): string {
    const { type, generate } = this.specs[id];
    const value = generate(this.random);
    return formatted ? type.format(value) : value;
  }
}

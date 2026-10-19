import type { DocumentGenerator } from './DocumentGenerator';

export type Unsubscribe = () => void;

export class GeneratedValues<Id extends string> {
  private readonly values = new Map<Id, string>();
  private readonly listeners = new Set<() => void>();

  constructor(private readonly generator: DocumentGenerator<Id>) {}

  current(id: Id): string | undefined {
    return this.values.get(id);
  }

  next(id: Id, formatted: boolean): string {
    const value = this.generator.generate(id, formatted);
    this.values.set(id, value);
    this.listeners.forEach((listener) => listener());
    return value;
  }

  currentOrNext(id: Id, formatted: boolean): string {
    return this.current(id) ?? this.next(id, formatted);
  }

  label(id: Id): string {
    return this.generator.label(id);
  }

  onDidChange(listener: () => void): Unsubscribe {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

import type { BatchSource } from '../application/batch/types';
import { batchColumns } from '../presentation/batchColumns';
import type { BatchFormValues, BatchTemplateView } from '../shared/sidebarProtocol';
import { createElement } from './dom';
import type { PostMessage } from './types';

export interface BatchFormElements {
  readonly template: HTMLSelectElement;
  readonly source: HTMLSelectElement;
  readonly count: HTMLInputElement;
  readonly format: HTMLSelectElement;
  readonly state: HTMLSelectElement;
  readonly seed: HTMLInputElement;
  readonly name: HTMLInputElement;
  readonly columns: HTMLElement;
  readonly generate: HTMLButtonElement;
  readonly save: HTMLButtonElement;
  readonly issues: HTMLElement;
}

interface ColumnRow {
  readonly key: string;
  readonly label: string;
  readonly enabled: HTMLInputElement;
  readonly column: HTMLInputElement;
}

const NO_TEMPLATE = 'Sem modelo salvo';

export class BatchForm {
  private rows: readonly ColumnRow[] = [];
  private templates = new Map<string, BatchFormValues>();

  constructor(
    private readonly elements: BatchFormElements,
    post: PostMessage,
  ) {
    elements.source.addEventListener('change', () => this.renderColumns(undefined));
    elements.template.addEventListener('change', () => this.applyTemplate(elements.template.value));
    elements.generate.addEventListener('click', () => post({ type: 'batch-generate', values: this.values() }));
    elements.save.addEventListener('click', () => post({ type: 'batch-save-template', values: this.values() }));
    this.renderColumns(undefined);
  }

  renderTemplates(templates: readonly BatchTemplateView[]): void {
    this.templates = new Map(templates.map(({ name, values }) => [name, values]));
    const options = [this.option('', NO_TEMPLATE), ...templates.map(({ name }) => this.option(name, name))];
    this.elements.template.replaceChildren(...options);
  }

  renderIssues(issues: readonly string[]): void {
    this.elements.issues.hidden = issues.length === 0;
    this.elements.issues.replaceChildren(...issues.map((issue) => createElement('li', 'issues__item', issue)));
  }

  private option(value: string, label: string): HTMLOptionElement {
    const option = createElement('option', '', label);
    option.value = value;
    return option;
  }

  private applyTemplate(name: string): void {
    const values = this.templates.get(name);
    if (!values) {
      return;
    }
    const { source, count, format, state, seed, name: target } = this.elements;
    source.value = values.source;
    count.value = values.count;
    format.value = values.format;
    state.value = values.state;
    seed.value = values.seed;
    target.value = values.name;
    this.renderColumns(values.columns);
  }

  private renderColumns(selected: BatchFormValues['columns'] | undefined): void {
    const chosen = new Map(selected?.map(({ key, column }) => [key, column]));
    this.rows = batchColumns(this.elements.source.value as BatchSource).map(({ key, label }) => {
      const enabled = document.createElement('input');
      enabled.type = 'checkbox';
      enabled.checked = selected === undefined || chosen.has(key);
      enabled.setAttribute('aria-label', `Incluir ${label}`);
      const column = document.createElement('input');
      column.className = 'field';
      column.value = chosen.get(key) ?? key;
      column.setAttribute('aria-label', `Nome da coluna ${label}`);
      return { key, label, enabled, column };
    });
    this.elements.columns.replaceChildren(
      ...this.rows.map((row) => {
        const element = createElement('label', 'column');
        element.append(row.enabled, createElement('span', 'column__label', row.label), row.column);
        return element;
      }),
    );
  }

  private values(): BatchFormValues {
    const { source, count, format, state, seed, name } = this.elements;
    return {
      source: source.value,
      count: count.value,
      format: format.value,
      state: state.value,
      seed: seed.value,
      name: name.value,
      columns: this.rows.filter((row) => row.enabled.checked).map((row) => ({ key: row.key, column: row.column.value })),
    };
  }
}

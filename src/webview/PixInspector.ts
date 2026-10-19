import type { PixView } from '../shared/sidebarProtocol';
import { createElement, debounce, resultText } from './dom';
import { INPUT_DEBOUNCE_MS } from './DocumentValidator';
import type { PostMessage } from './types';

export interface PixInspectorElements {
  readonly input: HTMLTextAreaElement;
  readonly summary: HTMLElement;
  readonly fields: HTMLElement;
  readonly issues: HTMLElement;
  readonly actions: HTMLElement;
  readonly openReport: HTMLButtonElement;
  readonly copyJson: HTMLButtonElement;
}

export class PixInspector {
  constructor(
    private readonly elements: PixInspectorElements,
    post: PostMessage,
  ) {
    const inspect = debounce<string>(INPUT_DEBOUNCE_MS, (text) => post({ type: 'inspect-pix', text }));
    elements.input.addEventListener('input', () => inspect(elements.input.value));
    elements.openReport.addEventListener('click', () => post({ type: 'open-pix-report', text: elements.input.value }));
    elements.copyJson.addEventListener('click', () => post({ type: 'copy-pix-json', text: elements.input.value }));
  }

  render(view: PixView): void {
    const { summary, fields, issues, actions } = this.elements;
    const empty = view.state === 'empty';
    summary.hidden = empty;
    summary.textContent = resultText(view.state, view.summary);
    summary.dataset.state = view.state;
    actions.hidden = empty;
    fields.hidden = view.fields.length === 0;
    fields.replaceChildren(...view.fields.flatMap(([label, value]) => [createElement('dt', 'fields__label', label), createElement('dd', 'fields__value', value)]));
    issues.hidden = view.issues.length === 0;
    issues.replaceChildren(...view.issues.map((issue) => createElement('li', 'issues__item', issue)));
  }
}

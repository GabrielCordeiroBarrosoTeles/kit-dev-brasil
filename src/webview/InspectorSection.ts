import type { InspectionView, SidebarToHostMessage } from '../shared/sidebarProtocol';
import { createElement, debounce, resultText } from './dom';
import { INPUT_DEBOUNCE_MS } from './DocumentValidator';
import type { PostMessage } from './types';

export interface InspectorSectionElements {
  readonly input: HTMLTextAreaElement;
  readonly summary: HTMLElement;
  readonly fields: HTMLElement;
  readonly issues: HTMLElement;
  readonly actions: HTMLElement;
}

export interface InspectorAction {
  readonly button: HTMLButtonElement;
  readonly message: (text: string) => SidebarToHostMessage;
}

export class InspectorSection {
  constructor(
    private readonly elements: InspectorSectionElements,
    inspect: (text: string) => SidebarToHostMessage,
    actions: readonly InspectorAction[],
    post: PostMessage,
  ) {
    const send = debounce<string>(INPUT_DEBOUNCE_MS, (text) => post(inspect(text)));
    elements.input.addEventListener('input', () => send(elements.input.value));
    for (const { button, message } of actions) {
      button.addEventListener('click', () => post(message(elements.input.value)));
    }
  }

  render(view: InspectionView): void {
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

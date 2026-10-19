import type { DocumentView } from '../shared/sidebarProtocol';
import { debounce, resultText } from './dom';
import type { PostMessage } from './types';

export const INPUT_DEBOUNCE_MS = 120;

export class DocumentValidator {
  constructor(
    input: HTMLInputElement,
    private readonly result: HTMLElement,
    private readonly copyButton: HTMLButtonElement,
    post: PostMessage,
  ) {
    const validate = debounce<string>(INPUT_DEBOUNCE_MS, (text) => post({ type: 'validate', text }));
    input.addEventListener('input', () => validate(input.value));
    copyButton.addEventListener('click', () => post({ type: 'copy-formatted', text: input.value }));
  }

  render(view: DocumentView): void {
    this.result.hidden = view.state === 'empty';
    this.result.textContent = resultText(view.state, view.message);
    this.result.dataset.state = view.state;
    this.copyButton.hidden = view.formatted === undefined;
  }
}

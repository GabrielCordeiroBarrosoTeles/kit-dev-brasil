import type { ResultState } from '../shared/sidebarProtocol';

export const queryElement = <T extends Element>(root: ParentNode, selector: string): T => {
  const element = root.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing element ${selector}`);
  }
  return element;
};

export const createElement = <K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text = ''): HTMLElementTagNameMap[K] => {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
};

export const debounce = <T>(delayMs: number, action: (value: T) => void): ((value: T) => void) => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (value: T) => {
    clearTimeout(timer);
    timer = setTimeout(() => action(value), delayMs);
  };
};

const RESULT_MARKS: Readonly<Record<Exclude<ResultState, 'empty'>, string>> = { valid: '✅', invalid: '❌', unknown: '⚠️' };

export const resultText = (state: ResultState, message: string): string => (state === 'empty' ? '' : `${RESULT_MARKS[state]} ${message}`);

export const iconButton = (icon: string, label: string, onClick: () => void): HTMLButtonElement => {
  const button = createElement('button', 'icon-button', icon);
  button.type = 'button';
  button.title = label;
  button.setAttribute('aria-label', label);
  button.addEventListener('click', onClick);
  return button;
};

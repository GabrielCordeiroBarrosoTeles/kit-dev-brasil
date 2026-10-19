import type { PixForm } from '../application/pix/generateStaticPix';
import type { PixGeneratedView } from '../shared/sidebarProtocol';
import { createElement } from './dom';
import type { PostMessage } from './types';

export interface PixGeneratorElements {
  readonly key: HTMLInputElement;
  readonly name: HTMLInputElement;
  readonly city: HTMLInputElement;
  readonly amount: HTMLInputElement;
  readonly txid: HTMLInputElement;
  readonly generate: HTMLButtonElement;
  readonly issues: HTMLElement;
  readonly result: HTMLElement;
  readonly qr: HTMLImageElement;
  readonly code: HTMLTextAreaElement;
  readonly copy: HTMLButtonElement;
}

export class PixGeneratorForm {
  constructor(
    private readonly elements: PixGeneratorElements,
    post: PostMessage,
  ) {
    elements.generate.addEventListener('click', () => post({ type: 'generate-pix', form: this.form() }));
    elements.copy.addEventListener('click', () => post({ type: 'copy-text', text: elements.code.value }));
  }

  render(view: PixGeneratedView): void {
    const { issues, result, qr, code } = this.elements;
    issues.hidden = view.issues.length === 0;
    issues.replaceChildren(...view.issues.map((issue) => createElement('li', 'issues__item', issue)));
    result.hidden = view.code === undefined;
    code.value = view.code ?? '';
    qr.src = view.qrDataUrl ?? '';
  }

  private form(): PixForm {
    const { key, name, city, amount, txid } = this.elements;
    return { key: key.value, merchantName: name.value, merchantCity: city.value, amount: amount.value, txid: txid.value };
  }
}

import type { ExportFormat } from '../presentation/profileExporters';
import { EXPORT_FORMATS } from '../presentation/profileExporters';
import type { ProfileKind } from '../presentation/profiles';
import type { ProfileView } from '../shared/sidebarProtocol';
import { createElement, iconButton } from './dom';
import type { PostMessage } from './types';

export interface ProfileGeneratorElements {
  readonly kind: HTMLSelectElement;
  readonly state: HTMLSelectElement;
  readonly generate: HTMLButtonElement;
  readonly fields: HTMLElement;
  readonly actions: HTMLElement;
  readonly copy: Readonly<Record<ExportFormat, HTMLButtonElement>>;
}

export class ProfileGeneratorForm {
  private exports: Readonly<Record<ExportFormat, string>> = { json: '', typescript: '', text: '' };

  constructor(
    private readonly elements: ProfileGeneratorElements,
    private readonly post: PostMessage,
  ) {
    elements.generate.addEventListener('click', () => post({ type: 'generate-profile', kind: elements.kind.value as ProfileKind, state: elements.state.value }));
    for (const format of EXPORT_FORMATS) {
      elements.copy[format].addEventListener('click', () => post({ type: 'copy-text', text: this.exports[format] }));
    }
  }

  render(view: ProfileView): void {
    const { fields, actions } = this.elements;
    this.exports = view.exports;
    fields.hidden = false;
    actions.hidden = false;
    fields.replaceChildren(
      ...view.fields.flatMap(([label, value]) => [
        createElement('dt', 'fields__label', label),
        createElement('dd', 'fields__value', value),
        iconButton('⧉', `Copiar ${label}`, () => this.post({ type: 'copy-text', text: value })),
      ]),
    );
  }
}

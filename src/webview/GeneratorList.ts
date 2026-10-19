import type { GeneratorId } from '../application/generation/generatorIds';
import type { GeneratorGroup } from '../shared/generatorCatalog';
import { GENERATOR_LABELS } from '../shared/generatorCatalog';
import type { SidebarState } from '../shared/sidebarProtocol';
import { createElement, iconButton } from './dom';
import type { PostMessage } from './types';

const EMPTY_VALUE = 'clique em ↻ para gerar';
const OPEN_GROUPS = 1;

export class GeneratorList {
  private readonly values = new Map<GeneratorId, HTMLElement>();

  constructor(
    container: HTMLElement,
    private readonly formatted: HTMLInputElement,
    groups: readonly GeneratorGroup[],
    private readonly post: PostMessage,
  ) {
    groups.forEach((group, index) => container.append(this.createGroup(group, index < OPEN_GROUPS)));
    formatted.addEventListener('change', () => post({ type: 'set-formatted', value: formatted.checked }));
  }

  render(state: SidebarState): void {
    this.formatted.checked = state.formatted;
    for (const [id, element] of this.values) {
      const value = state.generated[id];
      element.textContent = value ?? EMPTY_VALUE;
      element.classList.toggle('generator__value--empty', value === undefined);
    }
  }

  private createGroup(group: GeneratorGroup, open: boolean): HTMLElement {
    const details = createElement('details', 'generator-group');
    details.open = open;
    details.append(createElement('summary', 'generator-group__title', group.label), ...group.ids.map((id) => this.createRow(id)));
    return details;
  }

  private createRow(id: GeneratorId): HTMLElement {
    const label = GENERATOR_LABELS[id];
    const row = createElement('div', 'generator');
    const value = createElement('span', 'generator__value generator__value--empty', EMPTY_VALUE);
    value.title = 'Clique para copiar';
    value.addEventListener('click', () => this.post({ type: 'copy-generated', id }));
    this.values.set(id, value);
    row.append(
      createElement('span', 'generator__label', label),
      value,
      iconButton('⧉', `Copiar ${label}`, () => this.post({ type: 'copy-generated', id })),
      iconButton('↻', `Gerar outro ${label}`, () => this.post({ type: 'generate', id })),
    );
    return row;
  }
}

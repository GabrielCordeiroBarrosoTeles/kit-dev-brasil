import type { VsCodeApi } from './types';

export interface TabStore {
  get(): string | undefined;
  set(tab: string): void;
}

type KeyStep = (index: number, count: number) => number;

const KEY_STEPS: Readonly<Record<string, KeyStep>> = {
  ArrowRight: (index, count) => (index + 1) % count,
  ArrowLeft: (index, count) => (index - 1 + count) % count,
  Home: () => 0,
  End: (_index, count) => count - 1,
};

export const stateStore = (api: Pick<VsCodeApi, 'getState' | 'setState'>): TabStore => ({
  get: () => {
    const state = api.getState();
    return typeof state === 'object' && state !== null && typeof (state as { tab?: unknown }).tab === 'string' ? (state as { tab: string }).tab : undefined;
  },
  set: (tab) => api.setState({ tab }),
});

export class Tabs {
  constructor(
    private readonly tabs: readonly HTMLButtonElement[],
    private readonly panels: readonly HTMLElement[],
    private readonly store: TabStore,
  ) {
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => this.select(index, false));
      tab.addEventListener('keydown', (event) => this.navigate(event, index));
    });
    this.select(Math.max(0, tabs.findIndex((tab) => tab.dataset.tab === store.get())), false);
  }

  private navigate(event: KeyboardEvent, index: number): void {
    const step = KEY_STEPS[event.key];
    if (step) {
      event.preventDefault();
      this.select(step(index, this.tabs.length), true);
    }
  }

  private select(index: number, focus: boolean): void {
    this.tabs.forEach((tab, position) => {
      const selected = position === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected) {
        this.store.set(String(tab.dataset.tab));
      }
      if (selected && focus) {
        tab.focus();
      }
    });
    this.panels.forEach((panel, position) => {
      panel.hidden = position !== index;
    });
  }
}

export interface SidebarTab {
  readonly id: string;
  readonly label: string;
}

export const SIDEBAR_TABS: readonly SidebarTab[] = [
  { id: 'generate', label: 'Gerar' },
  { id: 'people', label: 'Pessoas' },
  { id: 'batch', label: 'Lote' },
  { id: 'validate', label: 'Validar' },
  { id: 'pix', label: 'PIX' },
];

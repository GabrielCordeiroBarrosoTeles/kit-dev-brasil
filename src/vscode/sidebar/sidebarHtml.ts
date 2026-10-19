import { SIDEBAR_TABS } from '../../shared/sidebarTabs';
import { SIDEBAR_PANELS } from './sidebarPanels';

export interface SidebarHtmlAssets {
  readonly cspSource: string;
  readonly scriptUri: string;
  readonly styleUri: string;
  readonly nonce: string;
}

const TAB_BUTTONS = SIDEBAR_TABS.map(
  ({ id, label }) => `<button id="tab-${id}" class="tab" type="button" role="tab" data-tab="${id}" aria-controls="panel-${id}" aria-selected="false" tabindex="-1">${label}</button>`,
).join('\n    ');

const TAB_PANELS = SIDEBAR_TABS.map(({ id }) => `<div id="panel-${id}" class="panel" role="tabpanel" aria-labelledby="tab-${id}" hidden>${SIDEBAR_PANELS[id]}\n  </div>`).join('\n\n  ');

export const renderSidebarHtml = ({ cspSource, scriptUri, styleUri, nonce }: SidebarHtmlAssets): string => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src ${cspSource}; script-src 'nonce-${nonce}';">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="${styleUri}">
</head>
<body>
  <nav class="tabs" role="tablist" aria-label="Ferramentas do Kit Dev Brasil">
    ${TAB_BUTTONS}
  </nav>

  ${TAB_PANELS}
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;

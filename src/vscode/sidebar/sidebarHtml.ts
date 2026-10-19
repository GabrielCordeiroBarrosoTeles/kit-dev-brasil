export interface SidebarHtmlAssets {
  readonly cspSource: string;
  readonly scriptUri: string;
  readonly styleUri: string;
  readonly nonce: string;
}

export const renderSidebarHtml = ({ cspSource, scriptUri, styleUri, nonce }: SidebarHtmlAssets): string => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource}; script-src 'nonce-${nonce}';">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="${styleUri}">
</head>
<body>
  <section class="section" aria-labelledby="generate-title">
    <header class="section__header">
      <h2 id="generate-title">Gerar</h2>
      <label class="toggle"><input type="checkbox" id="formatted"> com máscara</label>
    </header>
    <div id="generators" class="generators"></div>
  </section>

  <section class="section" aria-labelledby="validate-title">
    <header class="section__header"><h2 id="validate-title">Validar CPF ou CNPJ</h2></header>
    <input id="document-input" class="field" type="text" placeholder="Cole um CPF ou CNPJ" spellcheck="false" autocomplete="off">
    <p id="document-result" class="result" role="status" aria-live="polite" hidden></p>
    <div class="actions"><button id="copy-formatted" class="button button--secondary" type="button" hidden>Copiar formatado</button></div>
  </section>

  <section class="section" aria-labelledby="pix-title">
    <header class="section__header"><h2 id="pix-title">PIX copia-e-cola</h2></header>
    <textarea id="pix-input" class="field field--multiline" rows="3" placeholder="Cole o código PIX copia-e-cola" spellcheck="false"></textarea>
    <p id="pix-summary" class="result" role="status" aria-live="polite" hidden></p>
    <dl id="pix-fields" class="fields" hidden></dl>
    <ul id="pix-issues" class="issues" hidden></ul>
    <div id="pix-actions" class="actions" hidden>
      <button id="open-pix-report" class="button button--secondary" type="button">Abrir relatório</button>
      <button id="copy-pix-json" class="button button--secondary" type="button">Copiar JSON</button>
    </div>
  </section>

  <section class="section" aria-labelledby="selection-title">
    <header class="section__header"><h2 id="selection-title">Texto selecionado no editor</h2></header>
    <div class="actions">
      <button id="format-selection" class="button" type="button">Formatar</button>
      <button id="unformat-selection" class="button button--secondary" type="button">Remover máscara</button>
    </div>
  </section>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;

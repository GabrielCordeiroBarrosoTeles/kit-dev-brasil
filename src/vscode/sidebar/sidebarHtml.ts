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
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src ${cspSource}; script-src 'nonce-${nonce}';">
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
    <header class="section__header"><h2 id="validate-title">Validar documento</h2></header>
    <input id="document-input" class="field" type="text" placeholder="CPF, CNPJ, CNH, RG, título, PIS, placa, cartão…" spellcheck="false" autocomplete="off">
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

  <section class="section" aria-labelledby="pix-generate-title">
    <header class="section__header"><h2 id="pix-generate-title">Gerar PIX de teste</h2></header>
    <div class="form">
      <input id="pix-form-key" class="field" type="text" placeholder="Chave (e-mail, telefone, CPF, CNPJ ou aleatória)" spellcheck="false" autocomplete="off">
      <input id="pix-form-name" class="field" type="text" placeholder="Nome do recebedor" maxlength="25" spellcheck="false" autocomplete="off">
      <div class="form__row">
        <input id="pix-form-city" class="field" type="text" placeholder="Cidade" maxlength="15" spellcheck="false" autocomplete="off">
        <input id="pix-form-amount" class="field" type="text" placeholder="Valor (opcional)" inputmode="decimal" autocomplete="off">
      </div>
      <input id="pix-form-txid" class="field" type="text" placeholder="Identificador txid (opcional)" maxlength="25" spellcheck="false" autocomplete="off">
      <div class="actions"><button id="generate-pix" class="button" type="button">Gerar PIX</button></div>
    </div>
    <ul id="pix-form-issues" class="issues" hidden></ul>
    <div id="pix-generated" class="generated" hidden>
      <img id="pix-qr" class="qr" alt="QR code do PIX gerado">
      <textarea id="pix-code" class="field field--multiline" rows="3" readonly></textarea>
      <div class="actions"><button id="copy-pix-code" class="button button--secondary" type="button">Copiar código</button></div>
    </div>
  </section>

  <section class="section" aria-labelledby="boleto-title">
    <header class="section__header"><h2 id="boleto-title">Boleto</h2></header>
    <textarea id="boleto-input" class="field field--multiline" rows="2" placeholder="Cole a linha digitável ou o código de barras" spellcheck="false"></textarea>
    <p id="boleto-summary" class="result" role="status" aria-live="polite" hidden></p>
    <dl id="boleto-fields" class="fields" hidden></dl>
    <ul id="boleto-issues" class="issues" hidden></ul>
    <div id="boleto-actions" class="actions" hidden>
      <button id="copy-boleto-line" class="button button--secondary" type="button">Copiar linha digitável</button>
      <button id="copy-boleto-barcode" class="button button--secondary" type="button">Copiar código de barras</button>
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

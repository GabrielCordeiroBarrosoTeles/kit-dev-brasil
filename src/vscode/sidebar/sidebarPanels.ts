import { MAX_BATCH_COUNT, MIN_BATCH_COUNT } from '../../presentation/batchRequest';
import { BATCH_FORMAT_OPTIONS, BATCH_SOURCE_OPTIONS, KIND_OPTIONS, STATE_OPTIONS } from './sidebarOptions';

const generatePanel = `
    <section class="section" aria-labelledby="generate-title">
      <header class="section__header">
        <h2 id="generate-title">Documentos</h2>
        <label class="toggle"><input type="checkbox" id="formatted"> com máscara</label>
      </header>
      <div id="generators" class="generators"></div>
    </section>`;

const peoplePanel = `
    <section class="section" aria-labelledby="profile-title">
      <header class="section__header"><h2 id="profile-title">Pessoa ou empresa fictícia</h2></header>
      <div class="form">
        <div class="form__row">
          <select id="profile-kind" class="field" aria-label="Tipo">${KIND_OPTIONS}</select>
          <select id="profile-state" class="field" aria-label="UF">${STATE_OPTIONS}</select>
        </div>
        <div class="actions"><button id="generate-profile" class="button" type="button">Gerar</button></div>
      </div>
      <dl id="profile-fields" class="fields fields--copyable" hidden></dl>
      <div id="profile-actions" class="actions" hidden>
        <button id="copy-profile-json" class="button button--secondary" type="button">Copiar JSON</button>
        <button id="copy-profile-typescript" class="button button--secondary" type="button">Copiar TypeScript</button>
        <button id="copy-profile-text" class="button button--secondary" type="button">Copiar texto</button>
      </div>
    </section>`;

const batchPanel = `
    <section class="section" aria-labelledby="batch-title">
      <header class="section__header"><h2 id="batch-title">Gerar em lote</h2></header>
      <div class="form">
        <select id="batch-template" class="field" aria-label="Modelo salvo"><option value="">Sem modelo salvo</option></select>
        <select id="batch-source" class="field" aria-label="O que gerar">${BATCH_SOURCE_OPTIONS}</select>
        <div class="form__row">
          <input id="batch-count" class="field" type="number" min="${MIN_BATCH_COUNT}" max="${MAX_BATCH_COUNT}" value="10" aria-label="Quantidade">
          <select id="batch-format" class="field" aria-label="Formato">${BATCH_FORMAT_OPTIONS}</select>
        </div>
        <div class="form__row">
          <select id="batch-state" class="field" aria-label="UF">${STATE_OPTIONS}</select>
          <input id="batch-seed" class="field" type="text" placeholder="Semente (opcional)" spellcheck="false" autocomplete="off">
        </div>
        <input id="batch-name" class="field" type="text" placeholder="Tabela ou variável (opcional)" spellcheck="false" autocomplete="off">
      </div>
      <h3 class="subtitle">Campos</h3>
      <div id="batch-columns" class="columns" aria-label="Campos"></div>
      <div class="actions">
        <button id="batch-generate" class="button" type="button">Gerar</button>
        <button id="batch-save" class="button button--secondary" type="button">Salvar como modelo</button>
      </div>
      <ul id="batch-issues" class="issues" hidden></ul>
    </section>`;

const validatePanel = `
    <section class="section" aria-labelledby="validate-title">
      <header class="section__header"><h2 id="validate-title">Documento</h2></header>
      <input id="document-input" class="field" type="text" placeholder="CPF, CNPJ, CEP, CNH, RG, título, PIS, placa, cartão…" spellcheck="false" autocomplete="off">
      <p id="document-result" class="result" role="status" aria-live="polite" hidden></p>
      <div class="actions"><button id="copy-formatted" class="button button--secondary" type="button" hidden>Copiar formatado</button></div>
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
    </section>`;

const pixPanel = `
    <section class="section" aria-labelledby="pix-title">
      <header class="section__header"><h2 id="pix-title">Ler PIX copia-e-cola</h2></header>
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
    </section>`;

export const SIDEBAR_PANELS: Readonly<Record<string, string>> = {
  generate: generatePanel,
  people: peoplePanel,
  batch: batchPanel,
  validate: validatePanel,
  pix: pixPanel,
};

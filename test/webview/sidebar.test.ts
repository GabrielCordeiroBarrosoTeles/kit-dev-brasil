// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { HostToSidebarMessage, SidebarToHostMessage } from '../../src/shared/sidebarProtocol';
import { GENERATOR_GROUPS } from '../../src/shared/generatorCatalog';
import { emptyGenerated } from '../fakes/generators';
import { renderSidebarHtml } from '../../src/vscode/sidebar/sidebarHtml';
import { DocumentValidator, INPUT_DEBOUNCE_MS } from '../../src/webview/DocumentValidator';
import { createElement, debounce, queryElement } from '../../src/webview/dom';
import { GeneratorList } from '../../src/webview/GeneratorList';
import { InspectorSection } from '../../src/webview/InspectorSection';
import { PixGeneratorForm } from '../../src/webview/PixGeneratorForm';
import { ProfileGeneratorForm } from '../../src/webview/ProfileGeneratorForm';

const loadMarkup = () => {
  const html = renderSidebarHtml({ cspSource: 's', scriptUri: 'x.js', styleUri: 'x.css', nonce: 'n' });
  document.body.innerHTML = new DOMParser().parseFromString(html, 'text/html').body.innerHTML.replace(/<script[^>]*><\/script>/, '');
};

const element = <T extends Element>(selector: string): T => queryElement<T>(document, selector);

const type = (field: HTMLInputElement | HTMLTextAreaElement, value: string) => {
  field.value = value;
  field.dispatchEvent(new Event('input'));
};

beforeEach(() => {
  loadMarkup();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('dom helpers', () => {
  it('queries, creates and debounces', () => {
    expect(() => queryElement(document, '#missing')).toThrow('Missing element #missing');
    const item = createElement('li', 'x', 'texto');
    expect([item.tagName, item.className, item.textContent]).toEqual(['LI', 'x', 'texto']);
    const action = vi.fn();
    const debounced = debounce<number>(50, action);
    debounced(1);
    debounced(2);
    vi.advanceTimersByTime(50);
    expect(action.mock.calls).toEqual([[2]]);
  });
});

describe('GeneratorList', () => {
  const setup = () => {
    const posted: SidebarToHostMessage[] = [];
    const list = new GeneratorList(element('#generators'), element('#formatted'), GENERATOR_GROUPS, (message) => posted.push(message));
    return { posted, list };
  };

  it('renders a row per generator with copy and regenerate buttons', () => {
    const { posted } = setup();
    expect([...document.querySelectorAll('.generator-group__title')].map((title) => title.textContent)).toEqual(['Pessoa', 'Empresa', 'Endereço', 'Veículo', 'Cartão de crédito']);
    expect([...document.querySelectorAll<HTMLDetailsElement>('.generator-group')].map((group) => group.open)).toEqual([true, false, false, false, false]);
    expect(document.querySelectorAll('.generator__label')).toHaveLength(17);
    element<HTMLButtonElement>('[aria-label="Gerar outro CPF"]').click();
    element<HTMLButtonElement>('[aria-label="Copiar CNPJ"]').click();
    document.querySelectorAll<HTMLElement>('.generator__value')[2]?.click();
    expect(posted).toEqual([
      { type: 'generate', id: 'cpf' },
      { type: 'copy-generated', id: 'cnpj' },
      { type: 'copy-generated', id: 'cnh' },
    ]);
  });

  it('shows generated values and the mask preference', () => {
    const { list, posted } = setup();
    list.render({ generated: emptyGenerated({ cpf: '529.982.247-25' }), formatted: false });
    const [cpf, cnpj] = document.querySelectorAll<HTMLElement>('.generator__value');
    expect(cpf?.textContent).toBe('529.982.247-25');
    expect(cpf?.classList.contains('generator__value--empty')).toBe(false);
    expect(cnpj?.classList.contains('generator__value--empty')).toBe(true);
    const formatted = element<HTMLInputElement>('#formatted');
    expect(formatted.checked).toBe(false);
    formatted.checked = true;
    formatted.dispatchEvent(new Event('change'));
    expect(posted).toEqual([{ type: 'set-formatted', value: true }]);
  });
});

describe('DocumentValidator', () => {
  const setup = () => {
    const posted: SidebarToHostMessage[] = [];
    const validator = new DocumentValidator(element('#document-input'), element('#document-result'), element('#copy-formatted'), (message) => posted.push(message));
    return { posted, validator };
  };

  it('asks the host to validate after the user stops typing and copies the formatted value', () => {
    const { posted } = setup();
    const input = element<HTMLInputElement>('#document-input');
    type(input, '5299');
    type(input, '52998224725');
    expect(posted).toEqual([]);
    vi.advanceTimersByTime(INPUT_DEBOUNCE_MS);
    expect(posted).toEqual([{ type: 'validate', text: '52998224725' }]);
    element<HTMLButtonElement>('#copy-formatted').click();
    expect(posted.at(-1)).toEqual({ type: 'copy-formatted', text: '52998224725' });
  });

  it('renders each result state', () => {
    const { validator } = setup();
    const result = element<HTMLElement>('#document-result');
    const copy = element<HTMLButtonElement>('#copy-formatted');
    validator.render({ state: 'valid', message: 'CPF ok', formatted: '529.982.247-25' });
    expect([result.hidden, result.textContent, result.dataset.state, copy.hidden]).toEqual([false, '✅ CPF ok', 'valid', false]);
    validator.render({ state: 'unknown', message: 'Não parece', formatted: undefined });
    expect([result.textContent, copy.hidden]).toEqual(['⚠️ Não parece', true]);
    validator.render({ state: 'invalid', message: 'errado', formatted: '1' });
    expect(result.textContent).toBe('❌ errado');
    validator.render({ state: 'empty', message: '', formatted: undefined });
    expect([result.hidden, result.textContent]).toEqual([true, '']);
  });
});

describe('InspectorSection', () => {
  const setup = () => {
    const posted: SidebarToHostMessage[] = [];
    const inspector = new InspectorSection(
      {
        input: element('#pix-input'),
        summary: element('#pix-summary'),
        fields: element('#pix-fields'),
        issues: element('#pix-issues'),
        actions: element('#pix-actions'),
      },
      (text) => ({ type: 'inspect-pix', text }),
      [
        { button: element('#open-pix-report'), message: (text) => ({ type: 'open-pix-report', text }) },
        { button: element('#copy-pix-json'), message: (text) => ({ type: 'copy-pix-json', text }) },
      ],
      (message) => posted.push(message),
    );
    return { posted, inspector };
  };

  it('inspects pasted text and forwards the actions', () => {
    const { posted } = setup();
    type(element('#pix-input'), '000201');
    vi.advanceTimersByTime(INPUT_DEBOUNCE_MS);
    element<HTMLButtonElement>('#open-pix-report').click();
    element<HTMLButtonElement>('#copy-pix-json').click();
    expect(posted).toEqual([
      { type: 'inspect-pix', text: '000201' },
      { type: 'open-pix-report', text: '000201' },
      { type: 'copy-pix-json', text: '000201' },
    ]);
  });

  it('renders the summary, fields and issues', () => {
    const { inspector } = setup();
    inspector.render({ state: 'invalid', summary: 'PIX inválido', fields: [['Chave', 'a@b.co']], issues: ['CRC errado'] });
    expect(element<HTMLElement>('#pix-summary').textContent).toBe('❌ PIX inválido');
    expect([...document.querySelectorAll('#pix-fields dt, #pix-fields dd')].map((node) => node.textContent)).toEqual(['Chave', 'a@b.co']);
    expect(element<HTMLElement>('#pix-issues').textContent).toBe('CRC errado');
    expect(element<HTMLElement>('#pix-actions').hidden).toBe(false);
    inspector.render({ state: 'valid', summary: 'PIX válido', fields: [], issues: [] });
    expect([element<HTMLElement>('#pix-fields').hidden, element<HTMLElement>('#pix-issues').hidden]).toEqual([true, true]);
    inspector.render({ state: 'empty', summary: '', fields: [], issues: [] });
    expect([element<HTMLElement>('#pix-summary').hidden, element<HTMLElement>('#pix-actions').hidden]).toEqual([true, true]);
  });
});

describe('PixGeneratorForm', () => {
  const setup = () => {
    const posted: SidebarToHostMessage[] = [];
    const form = new PixGeneratorForm(
      {
        key: element('#pix-form-key'),
        name: element('#pix-form-name'),
        city: element('#pix-form-city'),
        amount: element('#pix-form-amount'),
        txid: element('#pix-form-txid'),
        generate: element('#generate-pix'),
        issues: element('#pix-form-issues'),
        result: element('#pix-generated'),
        qr: element('#pix-qr'),
        code: element('#pix-code'),
        copy: element('#copy-pix-code'),
      },
      (message) => posted.push(message),
    );
    return { posted, form };
  };

  it('sends the form and copies the generated code', () => {
    const { posted, form } = setup();
    element<HTMLInputElement>('#pix-form-key').value = 'a@b.co';
    element<HTMLInputElement>('#pix-form-name').value = 'FULANO';
    element<HTMLInputElement>('#pix-form-city').value = 'RECIFE';
    element<HTMLInputElement>('#pix-form-amount').value = '10,50';
    element<HTMLInputElement>('#pix-form-txid').value = 'T1';
    element<HTMLButtonElement>('#generate-pix').click();
    form.render({ code: '000201CODE', qrDataUrl: 'data:image/svg+xml;base64,AA', issues: [] });
    element<HTMLButtonElement>('#copy-pix-code').click();
    expect(posted).toEqual([
      { type: 'generate-pix', form: { key: 'a@b.co', merchantName: 'FULANO', merchantCity: 'RECIFE', amount: '10,50', txid: 'T1' } },
      { type: 'copy-text', text: '000201CODE' },
    ]);
    expect(element<HTMLElement>('#pix-generated').hidden).toBe(false);
    expect(element<HTMLImageElement>('#pix-qr').getAttribute('src')).toBe('data:image/svg+xml;base64,AA');
  });

  it('shows form issues and hides the result', () => {
    const { form } = setup();
    form.render({ code: undefined, qrDataUrl: undefined, issues: ['Chave: obrigatório'] });
    expect(element<HTMLElement>('#pix-form-issues').textContent).toBe('Chave: obrigatório');
    expect(element<HTMLElement>('#pix-generated').hidden).toBe(true);
    expect(element<HTMLTextAreaElement>('#pix-code').value).toBe('');
    form.render({ code: 'x', qrDataUrl: 'data:,', issues: [] });
    expect(element<HTMLElement>('#pix-form-issues').hidden).toBe(true);
  });
});

describe('main', () => {
  it('wires every component to the host', async () => {
    const posted: SidebarToHostMessage[] = [];
    vi.stubGlobal('acquireVsCodeApi', () => ({ postMessage: (message: SidebarToHostMessage) => posted.push(message) }));
    vi.resetModules();
    await import('../../src/webview/main');
    expect(posted).toEqual([{ type: 'ready' }]);
    const deliver = (message: HostToSidebarMessage) => window.dispatchEvent(new MessageEvent('message', { data: message }));
    deliver({ type: 'state', state: { generated: emptyGenerated({ cpf: '529.982.247-25' }), formatted: true } });
    deliver({ type: 'document-result', view: { state: 'valid', message: 'ok', formatted: 'x' } });
    deliver({ type: 'pix-result', view: { state: 'valid', summary: 'PIX válido', fields: [], issues: [] } });
    deliver({ type: 'boleto-result', view: { state: 'valid', summary: 'Boleto válido', fields: [], issues: [] } });
    deliver({ type: 'pix-generated', view: { code: 'CODE', qrDataUrl: 'data:,', issues: [] } });
    deliver({ type: 'profile-generated', view: { fields: [['Nome', 'Ana']], exports: { json: '{}', typescript: '', text: '' } } });
    expect(element<HTMLElement>('#profile-fields .fields__value').textContent).toBe('Ana');
    expect(element<HTMLElement>('#boleto-summary').textContent).toBe('✅ Boleto válido');
    expect(element<HTMLTextAreaElement>('#pix-code').value).toBe('CODE');
    element<HTMLButtonElement>('#open-pix-report').click();
    element<HTMLButtonElement>('#copy-pix-json').click();
    expect(posted.slice(-2)).toEqual([
      { type: 'open-pix-report', text: '' },
      { type: 'copy-pix-json', text: '' },
    ]);
    type(element('#pix-input'), '000201');
    vi.advanceTimersByTime(INPUT_DEBOUNCE_MS);
    expect(posted.at(-1)).toEqual({ type: 'inspect-pix', text: '000201' });
    type(element('#boleto-input'), '8467');
    vi.advanceTimersByTime(INPUT_DEBOUNCE_MS);
    element<HTMLButtonElement>('#copy-boleto-line').click();
    element<HTMLButtonElement>('#copy-boleto-barcode').click();
    expect(posted.slice(-3)).toEqual([
      { type: 'inspect-boleto', text: '8467' },
      { type: 'copy-boleto', text: '8467', format: 'line' },
      { type: 'copy-boleto', text: '8467', format: 'barcode' },
    ]);
    expect(document.querySelector('.generator__value')?.textContent).toBe('529.982.247-25');
    expect(element<HTMLElement>('#document-result').textContent).toBe('✅ ok');
    expect(element<HTMLElement>('#pix-summary').textContent).toBe('✅ PIX válido');
    element<HTMLButtonElement>('#format-selection').click();
    element<HTMLButtonElement>('#unformat-selection').click();
    expect(posted.slice(-2)).toEqual([{ type: 'format-selection' }, { type: 'unformat-selection' }]);
    vi.unstubAllGlobals();
  });
});

describe('ProfileGeneratorForm', () => {
  const setup = () => {
    const posted: SidebarToHostMessage[] = [];
    const form = new ProfileGeneratorForm(
      {
        kind: element('#profile-kind'),
        state: element('#profile-state'),
        generate: element('#generate-profile'),
        fields: element('#profile-fields'),
        actions: element('#profile-actions'),
        copy: { json: element('#copy-profile-json'), typescript: element('#copy-profile-typescript'), text: element('#copy-profile-text') },
      },
      (message) => posted.push(message),
    );
    return { posted, form };
  };

  it('offers person or company and every state', () => {
    expect([...element<HTMLSelectElement>('#profile-kind').options].map((option) => option.value)).toEqual(['person', 'company']);
    const states = [...element<HTMLSelectElement>('#profile-state').options];
    expect(states).toHaveLength(28);
    expect([states[0]?.value, states[0]?.textContent, states[1]?.textContent]).toEqual(['', 'UF aleatória', 'AC · Acre']);
  });

  it('requests a profile, renders copyable fields and copies the exports', () => {
    const { posted, form } = setup();
    element<HTMLButtonElement>('#copy-profile-json').click();
    element<HTMLSelectElement>('#profile-kind').value = 'company';
    element<HTMLSelectElement>('#profile-state').value = 'CE';
    element<HTMLButtonElement>('#generate-profile').click();
    expect(element<HTMLElement>('#profile-fields').hidden).toBe(true);
    form.render({ fields: [['Nome', 'Ana'], ['CEP', '60160-230']], exports: { json: '{}', typescript: 'const a = {};', text: 'Nome: Ana' } });
    expect(element<HTMLElement>('#profile-fields').hidden).toBe(false);
    expect(element<HTMLElement>('#profile-actions').hidden).toBe(false);
    expect([...document.querySelectorAll('#profile-fields .fields__value')].map((value) => value.textContent)).toEqual(['Ana', '60160-230']);
    element<HTMLButtonElement>('[aria-label="Copiar CEP"]').click();
    element<HTMLButtonElement>('#copy-profile-json').click();
    element<HTMLButtonElement>('#copy-profile-typescript').click();
    element<HTMLButtonElement>('#copy-profile-text').click();
    expect(posted).toEqual([
      { type: 'copy-text', text: '' },
      { type: 'generate-profile', kind: 'company', state: 'CE' },
      { type: 'copy-text', text: '60160-230' },
      { type: 'copy-text', text: '{}' },
      { type: 'copy-text', text: 'const a = {};' },
      { type: 'copy-text', text: 'Nome: Ana' },
    ]);
  });
});

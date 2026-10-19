// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { HostToSidebarMessage, SidebarToHostMessage } from '../../src/shared/sidebarProtocol';
import { SIDEBAR_GENERATORS } from '../../src/shared/sidebarProtocol';
import { renderSidebarHtml } from '../../src/vscode/sidebar/sidebarHtml';
import { DocumentValidator, INPUT_DEBOUNCE_MS } from '../../src/webview/DocumentValidator';
import { createElement, debounce, queryElement } from '../../src/webview/dom';
import { GeneratorList } from '../../src/webview/GeneratorList';
import { PixInspector } from '../../src/webview/PixInspector';

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
    const list = new GeneratorList(element('#generators'), element('#formatted'), SIDEBAR_GENERATORS, (message) => posted.push(message));
    return { posted, list };
  };

  it('renders a row per generator with copy and regenerate buttons', () => {
    const { posted } = setup();
    expect([...document.querySelectorAll('.generator__label')].map((label) => label.textContent)).toEqual(['CPF', 'CNPJ', 'CNPJ alfanumérico']);
    element<HTMLButtonElement>('[aria-label="Gerar outro CPF"]').click();
    element<HTMLButtonElement>('[aria-label="Copiar CNPJ"]').click();
    document.querySelectorAll<HTMLElement>('.generator__value')[2]?.click();
    expect(posted).toEqual([
      { type: 'generate', id: 'cpf' },
      { type: 'copy-generated', id: 'cnpj' },
      { type: 'copy-generated', id: 'alphanumericCnpj' },
    ]);
  });

  it('shows generated values and the mask preference', () => {
    const { list, posted } = setup();
    list.render({ generated: { cpf: '529.982.247-25', cnpj: undefined, alphanumericCnpj: undefined }, formatted: false });
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

describe('PixInspector', () => {
  const setup = () => {
    const posted: SidebarToHostMessage[] = [];
    const inspector = new PixInspector(
      {
        input: element('#pix-input'),
        summary: element('#pix-summary'),
        fields: element('#pix-fields'),
        issues: element('#pix-issues'),
        actions: element('#pix-actions'),
        openReport: element('#open-pix-report'),
        copyJson: element('#copy-pix-json'),
      },
      (message) => posted.push(message),
    );
    return { posted, inspector };
  };

  it('inspects pasted codes and forwards the actions', () => {
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

describe('main', () => {
  it('wires every component to the host', async () => {
    const posted: SidebarToHostMessage[] = [];
    vi.stubGlobal('acquireVsCodeApi', () => ({ postMessage: (message: SidebarToHostMessage) => posted.push(message) }));
    vi.resetModules();
    await import('../../src/webview/main');
    expect(posted).toEqual([{ type: 'ready' }]);
    const deliver = (message: HostToSidebarMessage) => window.dispatchEvent(new MessageEvent('message', { data: message }));
    deliver({ type: 'state', state: { generated: { cpf: '529.982.247-25', cnpj: undefined, alphanumericCnpj: undefined }, formatted: true } });
    deliver({ type: 'document-result', view: { state: 'valid', message: 'ok', formatted: 'x' } });
    deliver({ type: 'pix-result', view: { state: 'valid', summary: 'PIX válido', fields: [], issues: [] } });
    expect(document.querySelector('.generator__value')?.textContent).toBe('529.982.247-25');
    expect(element<HTMLElement>('#document-result').textContent).toBe('✅ ok');
    expect(element<HTMLElement>('#pix-summary').textContent).toBe('✅ PIX válido');
    element<HTMLButtonElement>('#format-selection').click();
    element<HTMLButtonElement>('#unformat-selection').click();
    expect(posted.slice(-2)).toEqual([{ type: 'format-selection' }, { type: 'unformat-selection' }]);
    vi.unstubAllGlobals();
  });
});

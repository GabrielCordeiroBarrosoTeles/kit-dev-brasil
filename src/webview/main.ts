import './sidebar.css';
import type { HostToSidebarMessage } from '../shared/sidebarProtocol';
import { GENERATOR_GROUPS } from '../shared/generatorCatalog';
import { BatchForm } from './BatchForm';
import { DocumentValidator } from './DocumentValidator';
import { queryElement } from './dom';
import { GeneratorList } from './GeneratorList';
import { InspectorSection } from './InspectorSection';
import { PixGeneratorForm } from './PixGeneratorForm';
import { ProfileGeneratorForm } from './ProfileGeneratorForm';
import { stateStore, Tabs } from './Tabs';
import './types';

const bootstrap = (): void => {
  const vscode = acquireVsCodeApi();
  const post = (message: Parameters<typeof vscode.postMessage>[0]): void => vscode.postMessage(message);
  const element = <T extends Element>(selector: string): T => queryElement<T>(document, selector);

  new Tabs([...document.querySelectorAll<HTMLButtonElement>('.tab')], [...document.querySelectorAll<HTMLElement>('.panel')], stateStore(vscode));
  const generators = new GeneratorList(element('#generators'), element('#formatted'), GENERATOR_GROUPS, post);
  const validator = new DocumentValidator(element('#document-input'), element('#document-result'), element('#copy-formatted'), post);
  const section = (prefix: string) => ({
    input: element<HTMLTextAreaElement>(`#${prefix}-input`),
    summary: element<HTMLElement>(`#${prefix}-summary`),
    fields: element<HTMLElement>(`#${prefix}-fields`),
    issues: element<HTMLElement>(`#${prefix}-issues`),
    actions: element<HTMLElement>(`#${prefix}-actions`),
  });
  const pix = new InspectorSection(
    section('pix'),
    (text) => ({ type: 'inspect-pix', text }),
    [
      { button: element('#open-pix-report'), message: (text) => ({ type: 'open-pix-report', text }) },
      { button: element('#copy-pix-json'), message: (text) => ({ type: 'copy-pix-json', text }) },
    ],
    post,
  );
  const boleto = new InspectorSection(
    section('boleto'),
    (text) => ({ type: 'inspect-boleto', text }),
    [
      { button: element('#copy-boleto-line'), message: (text) => ({ type: 'copy-boleto', text, format: 'line' }) },
      { button: element('#copy-boleto-barcode'), message: (text) => ({ type: 'copy-boleto', text, format: 'barcode' }) },
    ],
    post,
  );
  const pixGenerator = new PixGeneratorForm(
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
    post,
  );
  const profiles = new ProfileGeneratorForm(
    {
      kind: element('#profile-kind'),
      state: element('#profile-state'),
      generate: element('#generate-profile'),
      fields: element('#profile-fields'),
      actions: element('#profile-actions'),
      copy: { json: element('#copy-profile-json'), typescript: element('#copy-profile-typescript'), text: element('#copy-profile-text') },
    },
    post,
  );
  const batch = new BatchForm(
    {
      template: element('#batch-template'),
      source: element('#batch-source'),
      count: element('#batch-count'),
      format: element('#batch-format'),
      state: element('#batch-state'),
      seed: element('#batch-seed'),
      name: element('#batch-name'),
      columns: element('#batch-columns'),
      generate: element('#batch-generate'),
      save: element('#batch-save'),
      issues: element('#batch-issues'),
    },
    post,
  );
  element<HTMLButtonElement>('#format-selection').addEventListener('click', () => post({ type: 'format-selection' }));
  element<HTMLButtonElement>('#unformat-selection').addEventListener('click', () => post({ type: 'unformat-selection' }));

  window.addEventListener('message', (event: MessageEvent<HostToSidebarMessage>) => {
    const message = event.data;
    switch (message.type) {
      case 'state':
        generators.render(message.state);
        break;
      case 'document-result':
        validator.render(message.view);
        break;
      case 'pix-result':
        pix.render(message.view);
        break;
      case 'boleto-result':
        boleto.render(message.view);
        break;
      case 'pix-generated':
        pixGenerator.render(message.view);
        break;
      case 'profile-generated':
        profiles.render(message.view);
        break;
      case 'batch-state':
        batch.renderTemplates(message.templates);
        break;
      case 'batch-result':
        batch.renderIssues(message.issues);
        break;
    }
  });

  post({ type: 'ready' });
};

bootstrap();

import './sidebar.css';
import type { HostToSidebarMessage } from '../shared/sidebarProtocol';
import { SIDEBAR_GENERATORS } from '../shared/sidebarProtocol';
import { DocumentValidator } from './DocumentValidator';
import { queryElement } from './dom';
import { GeneratorList } from './GeneratorList';
import { PixInspector } from './PixInspector';
import './types';

const bootstrap = (): void => {
  const vscode = acquireVsCodeApi();
  const post = (message: Parameters<typeof vscode.postMessage>[0]): void => vscode.postMessage(message);
  const element = <T extends Element>(selector: string): T => queryElement<T>(document, selector);

  const generators = new GeneratorList(element('#generators'), element('#formatted'), SIDEBAR_GENERATORS, post);
  const validator = new DocumentValidator(element('#document-input'), element('#document-result'), element('#copy-formatted'), post);
  const pix = new PixInspector(
    {
      input: element('#pix-input'),
      summary: element('#pix-summary'),
      fields: element('#pix-fields'),
      issues: element('#pix-issues'),
      actions: element('#pix-actions'),
      openReport: element('#open-pix-report'),
      copyJson: element('#copy-pix-json'),
    },
    post,
  );
  element<HTMLButtonElement>('#format-selection').addEventListener('click', () => post({ type: 'format-selection' }));
  element<HTMLButtonElement>('#unformat-selection').addEventListener('click', () => post({ type: 'unformat-selection' }));

  window.addEventListener('message', (event: MessageEvent<HostToSidebarMessage>) => {
    const message = event.data;
    if (message.type === 'state') {
      generators.render(message.state);
    } else if (message.type === 'document-result') {
      validator.render(message.view);
    } else {
      pix.render(message.view);
    }
  });

  post({ type: 'ready' });
};

bootstrap();

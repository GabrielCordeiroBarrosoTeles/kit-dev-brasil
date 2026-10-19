import type { SidebarToHostMessage } from '../shared/sidebarProtocol';

export type PostMessage = (message: SidebarToHostMessage) => void;

export interface VsCodeApi {
  postMessage(message: SidebarToHostMessage): void;
}

declare global {
  function acquireVsCodeApi(): VsCodeApi;
}

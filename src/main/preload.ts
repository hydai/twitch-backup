import { contextBridge, ipcRenderer } from 'electron';
import type { IpcChannels } from '../shared/types';

const api = {
  invoke: (channel: IpcChannels, ...args: any[]) => {
    return ipcRenderer.invoke(channel, ...args);
  },
  on: (channel: string, callback: Function) => {
    ipcRenderer.on(channel, (_, ...args) => callback(...args));
  },
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  }
};

contextBridge.exposeInMainWorld('electronAPI', api);

export type ElectronAPI = typeof api;
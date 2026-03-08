/**
 * Global types and declarations
 * @module core/types/global
 */

export interface ElectronAPI {
  getPrinters: () => Promise<{ name: string; isDefault: boolean }[]>;
  print: (content: string, printerName: string) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type ValueOf<T> = T[keyof T];

// src/types/electron.d.ts
export interface ElectronAPI {
    getPrinters: () => Promise<{ name: string; isDefault: boolean }[]>;
    print: (content: string, printerName: string) => void;
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}
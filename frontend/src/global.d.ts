declare module 'opencv.js' {
    const cv: any;
    export default cv;
  }

declare module 'mammoth' {
  export function convertToHtml(options: { arrayBuffer: ArrayBuffer }): Promise<{ value: string; messages: unknown[] }>;
}
  
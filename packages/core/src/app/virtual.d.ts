/// <reference types="vite/client" />

declare module 'virtual:opencanva/designs' {
  export const designIds: string[];
  export function loadDesign(id: string): Promise<unknown>;
}

declare module 'virtual:opencanva/config' {
  interface ResolvedConfig {
    designsDir: string;
    artboard: { w: number; h: number; background?: string };
    build: {
      showDesignBrowser: boolean;
      showDesignUi: boolean;
      allowPngDownload: boolean;
      allowSvgDownload: boolean;
      allowPdfDownload: boolean;
    };
    version: string;
  }
  const config: ResolvedConfig;
  export default config;
}

declare module '*.css?raw' {
  const content: string;
  export default content;
}

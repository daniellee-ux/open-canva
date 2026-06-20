import type { Artboard } from './sdk';

export interface OpencanvaBuildConfig {
  /** Show the design library / home page. */
  showDesignBrowser?: boolean;
  /** Show the editing UI (toolbar, inspector, layers). Off → clean viewer build. */
  showDesignUi?: boolean;
  allowPngDownload?: boolean;
  allowSvgDownload?: boolean;
  allowPdfDownload?: boolean;
}

export interface OpencanvaConfig {
  base?: string;
  /** Directory holding `designs/<id>/index.tsx`. Default: "designs". */
  designsDir?: string;
  themesDir?: string;
  assetsDir?: string;
  port?: number;
  /** Default artboard for designs that don't set their own `artboard`. */
  artboard?: Artboard;
  build?: OpencanvaBuildConfig;
}

// Public API of @opencanva/core — what designs under designs/<id>/ import.
export type { Scene, DesignMeta, DesignModule, Artboard } from './sdk';
export { DEFAULT_ARTBOARD, artboardPresets, resolveArtboard } from './sdk';
export type { DesignSystem } from './design';
export { defaultDesign, designPresets, designToCssVars, resolveDesign } from './design';
export { useSceneInfo } from './scene-context';
export type { OpencanvaConfig, OpencanvaBuildConfig } from './config';
export {
  Box,
  Text,
  Ellipse,
  Line,
  ImageObject,
  Group,
  Icon,
} from './primitives';

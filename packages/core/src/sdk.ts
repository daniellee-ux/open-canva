import type { FC } from 'react';
import type { DesignSystem } from './design';

/**
 * The OpenCanva module contract — the canvas analog of open-slide's `Page` /
 * open-doc's `Section`. A *design* is an ordered array of `Scene`s; each Scene is
 * a fixed-size **artboard** holding absolutely-positioned graphic objects.
 *
 * Most designs have a single Scene (one poster / one social post). Multiple
 * Scenes form a carousel / multi-board set (e.g. an Instagram carousel or size
 * variations), laid out side by side on the infinite canvas.
 *
 * Scene metadata lives as static properties on the component (like open-slide's
 * `Page.transition`); `Stage` reads them at render time.
 */
export type Scene = FC & {
  /** Stable id for the layers panel + deep links. Defaults to `scene-{n}`. */
  id?: string;
  /** Human label shown in the board switcher / layers panel. (Not `name` —
   *  `Function.name` is a read-only built-in and assigning to it throws.) */
  label?: string;
  /** Per-scene artboard size, overriding the module-level `artboard`. */
  artboard?: Artboard;
};

export interface DesignMeta {
  title?: string;
  author?: string;
  theme?: string;
  /** ISO 8601 string literal — quoted, so the build-time meta regex can scrape it. */
  createdAt?: string;
}

/**
 * The geometry constant the whole renderer keys off — replaces open-slide's
 * CANVAS_WIDTH=1920 / CANVAS_HEIGHT=1080. Sizes are in artboard pixels (the unit
 * authors position objects in); the stage scales the whole artboard to fit.
 */
export interface Artboard {
  /** Artboard width in px. */
  w: number;
  /** Artboard height in px. */
  h: number;
  /** Solid background (a CSS color or gradient). Default: white. */
  background?: string;
}

export interface DesignModule {
  default: Scene[];
  meta?: DesignMeta;
  design?: DesignSystem;
  /** Default artboard size for every scene that doesn't set its own. */
  artboard?: Artboard;
}

/**
 * Replaces open-slide's CANVAS_WIDTH/HEIGHT — the default artboard (IG square).
 * No `background` on purpose: when unset, the Board falls back to the theme's
 * `--ox-bg`, so picking a theme themes the whole artboard. Authors set
 * `background` explicitly (a color or gradient) to override the theme.
 */
export const DEFAULT_ARTBOARD: Artboard = { w: 1080, h: 1080 };

/** Named artboard sizes authors can spread into `export const artboard`. */
export const artboardPresets: Record<string, Artboard> = {
  'square': { w: 1080, h: 1080 },
  'instagram-post': { w: 1080, h: 1080 },
  'instagram-story': { w: 1080, h: 1920 },
  'instagram-portrait': { w: 1080, h: 1350 },
  'twitter-post': { w: 1600, h: 900 },
  'facebook-cover': { w: 1640, h: 624 },
  'youtube-thumbnail': { w: 1280, h: 720 },
  'presentation-16x9': { w: 1920, h: 1080 },
  'poster-a4-portrait': { w: 1240, h: 1754 },
  'poster-a4-landscape': { w: 1754, h: 1240 },
  'business-card': { w: 1050, h: 600 },
  'banner-leaderboard': { w: 728, h: 90 },
};

/** Resolve the effective artboard for a scene: per-scene wins, then module, then default. */
export function resolveArtboard(scene: Scene, moduleArtboard?: Artboard): Artboard {
  return { ...DEFAULT_ARTBOARD, ...moduleArtboard, ...scene.artboard };
}

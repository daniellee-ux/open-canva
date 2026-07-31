import type { FC } from 'react';
import type { DesignSystem } from './design';

/**
 * The OpenCanva module contract — the canvas analog of open-slide's `Page` /
 * open-doc's `Section`. A *design* is an ordered array of `Scene`s; each Scene is
 * a fixed-size **artboard** holding absolutely-positioned graphic objects.
 *
 * Most designs have a single Scene (one poster / one social post). Multiple
 * Scenes form a carousel / multi-board set (e.g. an Instagram carousel or size
 * variations), auto-arranged on the infinite canvas — a single row by default,
 * or a vertical stack / wrapped grid via `export const layout` (see
 * `BoardLayout`).
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
  /**
   * Start a new line at this board — a new row in `row` direction, a new column
   * in `column` direction. The local way to stack: leave the module `layout`
   * alone and set `NewVersion.break = true` to drop this board (and everything
   * after it) onto the next row. Ignored on the first scene.
   */
  break?: boolean;
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

/**
 * How multiple Scenes are arranged on the canvas. Boards auto-flow along one
 * axis and wrap onto new lines, so a design can be one row (the default), a
 * vertical stack, or a grid — e.g. six versions in a row with a seventh
 * directly beneath them.
 *
 * Boards never overlap: each line is sized by its tallest (or widest) board.
 */
export interface BoardLayout {
  /**
   * Flow axis. `'row'` (default) runs boards left→right; `'column'` stacks them
   * top→bottom.
   */
  direction?: 'row' | 'column';
  /**
   * Wrap onto a new line after this many boards — boards per row in `row`
   * direction, boards per column in `column` direction. Omit for one unbroken
   * line. A scene's own `break` starts a new line regardless.
   */
  wrap?: number;
  /** Gap along the flow axis, in artboard px. Default 96. */
  gap?: number;
  /** Gap across the flow axis — between rows (or columns). Defaults to `gap`. */
  crossGap?: number;
  /**
   * How boards of unequal size sit across the flow axis within their line —
   * e.g. a short board among tall ones in a row. Default `'center'`.
   */
  align?: 'start' | 'center' | 'end';
  /**
   * How a short line sits along the flow axis relative to the longest one —
   * e.g. a single board under a row of six. Default `'start'`.
   */
  justify?: 'start' | 'center' | 'end';
}

export interface DesignModule {
  default: Scene[];
  meta?: DesignMeta;
  design?: DesignSystem;
  /** Default artboard size for every scene that doesn't set its own. */
  artboard?: Artboard;
  /** Multi-board arrangement on the canvas. Default: a single horizontal row. */
  layout?: BoardLayout;
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

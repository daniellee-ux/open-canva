import type { CSSProperties } from 'react';

/**
 * Graphic-design tokens — same machinery as open-slide's `DesignSystem` /
 * `designToCssVars`, but oriented to graphics: a display/body font pair, a
 * brand palette with two accents, a default corner radius. Emitted as `--ox-*`
 * CSS variables on the `[data-ox-board]` artboard root, so authors reference
 * `var(--ox-accent)` in any object's `fill` / `color`.
 */
export interface DesignSystem {
  palette: {
    /** Artboard background. */
    bg: string;
    /** Primary foreground / text. */
    fg: string;
    /** Secondary / muted text. */
    muted: string;
    /** Primary accent (brand color). */
    accent: string;
    /** Secondary accent. */
    accent2: string;
    /** Card / panel surface color. */
    surface: string;
  };
  fonts: {
    /** Headlines, big numbers, logos. */
    display: string;
    /** Body copy, captions. */
    body: string;
  };
  /** Default corner radius (px) for boxes/images. */
  radius: number;
}

export const defaultDesign: DesignSystem = {
  palette: {
    bg: '#0e1116',
    fg: '#f5f3ee',
    muted: '#9aa3af',
    accent: '#ff5c38',
    accent2: '#ffd23f',
    surface: '#1a1f27',
  },
  fonts: {
    display: "'Poppins', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
    body: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif",
  },
  radius: 24,
};

/** Built-in graphic themes, selectable via `meta.theme` or the /themes gallery. */
export const designPresets: Record<string, DesignSystem> = {
  ember: defaultDesign,
  noir: {
    palette: {
      bg: '#111111',
      fg: '#ffffff',
      muted: '#8a8a8a',
      accent: '#e8e8e8',
      accent2: '#c9a227',
      surface: '#1d1d1d',
    },
    fonts: {
      display: "'Playfair Display', Georgia, 'Times New Roman', serif",
      body: "ui-sans-serif, system-ui, 'Helvetica Neue', Arial, sans-serif",
    },
    radius: 0,
  },
  sunset: {
    palette: {
      bg: '#2a1339',
      fg: '#fff5f0',
      muted: '#c9a6c4',
      accent: '#ff7a59',
      accent2: '#ffd166',
      surface: '#3a1d4d',
    },
    fonts: {
      display: "'Poppins', ui-sans-serif, system-ui, sans-serif",
      body: "ui-sans-serif, system-ui, -apple-system, sans-serif",
    },
    radius: 28,
  },
  mint: {
    palette: {
      bg: '#f3faf6',
      fg: '#0f2a1d',
      muted: '#5b756a',
      accent: '#11a974',
      accent2: '#0a7ea4',
      surface: '#ffffff',
    },
    fonts: {
      display: "'Poppins', ui-sans-serif, system-ui, sans-serif",
      body: "ui-sans-serif, system-ui, -apple-system, sans-serif",
    },
    radius: 20,
  },
  blueprint: {
    palette: {
      bg: '#0b2447',
      fg: '#eaf2ff',
      muted: '#8fb0d9',
      accent: '#19a7ce',
      accent2: '#e3fdfd',
      surface: '#103a6b',
    },
    fonts: {
      display: "ui-monospace, 'SFMono-Regular', 'JetBrains Mono', Menlo, monospace",
      body: "ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace",
    },
    radius: 8,
  },
  bubblegum: {
    palette: {
      bg: '#fff0f6',
      fg: '#3d1733',
      muted: '#9e6b8c',
      accent: '#ff4d8d',
      accent2: '#7b5cff',
      surface: '#ffffff',
    },
    fonts: {
      display: "'Poppins', ui-rounded, system-ui, sans-serif",
      body: "ui-sans-serif, system-ui, -apple-system, sans-serif",
    },
    radius: 32,
  },
  // Inspired by frontend-slides "Bold Signal" — confident, high-impact.
  'bold-signal': {
    palette: {
      bg: '#1a1a1a',
      fg: '#ffffff',
      muted: '#8c8c8c',
      accent: '#ff5722',
      accent2: '#ffd23f',
      surface: '#2d2d2d',
    },
    fonts: {
      display: "'Archivo Black', 'Arial Black', sans-serif",
      body: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
    },
    radius: 18,
  },
  // Inspired by frontend-slides "Dark Botanical" — elegant, premium serif.
  botanical: {
    palette: {
      bg: '#0f0f0f',
      fg: '#e8e4df',
      muted: '#9a9590',
      accent: '#d4a574',
      accent2: '#e8b4b8',
      surface: '#1b1916',
    },
    fonts: {
      display: "'Cormorant', Georgia, 'Times New Roman', serif",
      body: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
    },
    radius: 8,
  },
  // Inspired by frontend-slides "Swiss Modern" — Bauhaus, precise, red accent.
  swiss: {
    palette: {
      bg: '#ffffff',
      fg: '#0a0a0a',
      muted: '#666666',
      accent: '#ff3300',
      accent2: '#0a0a0a',
      surface: '#f2f2f2',
    },
    fonts: {
      display: "'Archivo Black', 'Arial Black', sans-serif",
      body: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
    },
    radius: 0,
  },
};

/** Resolve the effective design: explicit `design` wins, else `meta.theme`, else default. */
export function resolveDesign(opts: { design?: DesignSystem; theme?: string }): DesignSystem {
  if (opts.design) return opts.design;
  if (opts.theme && designPresets[opts.theme]) return designPresets[opts.theme];
  return defaultDesign;
}

export function designToCssVars(d: DesignSystem): CSSProperties {
  return {
    '--ox-bg': d.palette.bg,
    '--ox-fg': d.palette.fg,
    '--ox-muted': d.palette.muted,
    '--ox-accent': d.palette.accent,
    '--ox-accent2': d.palette.accent2,
    '--ox-surface': d.palette.surface,
    '--ox-font-display': d.fonts.display,
    '--ox-font-body': d.fonts.body,
    '--ox-radius': `${d.radius}px`,
  } as CSSProperties;
}

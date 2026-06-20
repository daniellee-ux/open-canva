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

/**
 * Built-in graphic themes, selectable via `meta.theme` or the /themes gallery.
 *
 * The "extended gallery" entries below were drawn from reference style packs
 * (frontend-slides / feishu-whiteboard) and are now the single source of truth:
 * the matching example designs in apps/demo reference them via `meta.theme`
 * rather than declaring an inline `design`. (Exception: berry-smoothie keeps an
 * inline palette because its white-on-colored-blocks fg differs from the `berry`
 * theme's readable standalone fg.)
 */
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

  /* ---------- Extended gallery (verbatim from apps/demo design palettes) ---------- */

  // Apricot Arc — warm, retro, geometric (apricot-onboarding).
  apricot: {
    palette: { bg: '#FFF8EE', fg: '#C7561E', muted: '#7A4A33', accent: '#F69834', accent2: '#F9C2BD', surface: '#FFFFFF' },
    fonts: { display: "'Poppins', ui-sans-serif, system-ui, sans-serif", body: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif" },
    radius: 24,
  },
  // Avocado Press — clean duotone, blue + lime (avocado-market).
  avocado: {
    palette: { bg: '#FFFFFF', fg: '#0055A4', muted: '#9CC0E0', accent: '#0055A4', accent2: '#DCF4A2', surface: '#F2F8FF' },
    fonts: { display: "'Archivo Black', 'Syne', ui-sans-serif, system-ui, sans-serif", body: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif" },
    radius: 8,
  },
  // Berry Pop — fruity, raspberry + periwinkle. fg is a deep berry (readable on
  // the white bg) rather than berry-smoothie's white-on-colored-blocks fg, so the
  // theme works standalone; that design keeps its own inline palette.
  berry: {
    palette: { bg: '#FFFFFF', fg: '#6E1E3A', muted: '#9DB0E8', accent: '#9E2B50', accent2: '#C7D2F0', surface: '#FBF3F6' },
    fonts: { display: "'Syne', ui-sans-serif, system-ui, sans-serif", body: "'Manrope', ui-sans-serif, system-ui, sans-serif" },
    radius: 22,
  },
  // BlockFrame — maximalist candy, pink + blue (blockframe-fest).
  blockframe: {
    palette: { bg: '#FFFDF5', fg: '#000000', muted: '#7A7466', accent: '#FE90E8', accent2: '#F7CB46', surface: '#FFFFFF' },
    fonts: { display: "'Archivo Black', ui-sans-serif, system-ui, sans-serif", body: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif" },
    radius: 0,
  },
  // Bold Poster — loud type, single red accent (bold-hiring).
  'bold-poster': {
    palette: { bg: '#FFFFFF', fg: '#1C1410', muted: '#8A8178', accent: '#D8000F', accent2: '#D8000F', surface: '#F5F2EF' },
    fonts: { display: "'Archivo Black', ui-sans-serif, system-ui, sans-serif", body: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif" },
    radius: 0,
  },
  // Burst Panel — loud, energetic dashboard (burst-metrics).
  burst: {
    palette: { bg: '#FBD65A', fg: '#1E1E1E', muted: '#BD89E4', accent: '#AAE4BA', accent2: '#CFACE8', surface: '#CFACE8' },
    fonts: { display: "'Archivo Black', 'Space Grotesk', ui-sans-serif, system-ui, sans-serif", body: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif" },
    radius: 18,
  },
  // Cobalt Bloom — oversized type, fashion editorial (cobalt-fashion).
  cobalt: {
    palette: { bg: '#DDA8A2', fg: '#171717', muted: '#B98A84', accent: '#4746C6', accent2: '#CE968F', surface: '#F4EFE9' },
    fonts: { display: "'Archivo Black', 'Syne', ui-sans-serif, system-ui, sans-serif", body: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif" },
    radius: 0,
  },
  // Coral — warm, friendly, signature coral (coral-newsletter).
  coral: {
    palette: { bg: '#F5F0E8', fg: '#1A1A1A', muted: '#6B6B6B', accent: '#E85D5D', accent2: '#D44A4A', surface: '#FFFFFF' },
    fonts: { display: "'Fraunces', Georgia, serif", body: "'Manrope', ui-sans-serif, system-ui, sans-serif" },
    radius: 12,
  },
  // Electric Studio — bold, clean, high-contrast blue (electric-update).
  electric: {
    palette: { bg: '#ffffff', fg: '#0a0a0a', muted: '#c7cdd6', accent: '#4361ee', accent2: '#d6ff3d', surface: '#f3f5fb' },
    fonts: { display: "'Manrope', ui-sans-serif, system-ui, sans-serif", body: "'Manrope', ui-sans-serif, system-ui, sans-serif" },
    radius: 18,
  },
  // Grove — editorial, parchment + forest green (grove-retreat).
  grove: {
    palette: { bg: '#e8e4d6', fg: '#192b1b', muted: '#7c7a66', accent: '#192b1b', accent2: '#c8524a', surface: '#dedad0' },
    fonts: { display: "'Fraunces', Georgia, serif", body: "'Work Sans', ui-sans-serif, system-ui, sans-serif" },
    radius: 6,
  },
  // Jade Lens — calm, minimal green (jade-mindful).
  jade: {
    palette: { bg: '#F5F1EE', fg: '#1E2421', muted: '#08754C', accent: '#2BA483', accent2: '#2CAE8C', surface: '#EBE6E1' },
    fonts: { display: "'Fraunces', Georgia, serif", body: "'Manrope', ui-sans-serif, system-ui, sans-serif" },
    radius: 24,
  },
  // Lime Slab — electric, bold, modern SaaS (lime-saas).
  lime: {
    palette: { bg: '#EEFA79', fg: '#0A0A05', muted: '#9A9A86', accent: '#EEFA79', accent2: '#FFFFF2', surface: '#FFFFF2' },
    fonts: { display: "'Archivo Black', ui-sans-serif, system-ui, sans-serif", body: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif" },
    radius: 16,
  },
  // Macchiato — warm monochrome, almond + espresso (macchiato-menu).
  macchiato: {
    palette: { bg: '#EDE7DD', fg: '#25211B', muted: '#6E6558', accent: '#9A917F', accent2: '#9A917F', surface: '#E5DECF' },
    fonts: { display: "'Fraunces', Georgia, serif", body: "'Work Sans', ui-sans-serif, system-ui, sans-serif" },
    radius: 14,
  },
  // Monochrome — quiet, text-first (monochrome-manifesto).
  monochrome: {
    palette: { bg: '#FAFADF', fg: '#1A1A16', muted: '#5E5E54', accent: '#1A1A16', accent2: '#8A8A80', surface: '#F0F0D4' },
    fonts: { display: "'Fraunces', Georgia, 'Times New Roman', serif", body: "'Work Sans', ui-sans-serif, system-ui, sans-serif" },
    radius: 2,
  },
  // Neon Cyber — futuristic navy, cyan + magenta (neon-hackathon).
  neon: {
    palette: { bg: '#0a0f1c', fg: '#eafffb', muted: '#7c8aa6', accent: '#00ffcc', accent2: '#ff00aa', surface: '#111a2e' },
    fonts: { display: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif", body: "'Manrope', ui-sans-serif, system-ui, sans-serif" },
    radius: 28,
  },
  // Notebook Tabs — cream editorial paper (notebook-reading).
  notebook: {
    palette: { bg: '#F4EEE3', fg: '#1a1a1a', muted: '#8a8a8a', accent: '#c7967a', accent2: '#98d4bb', surface: '#f8f6f1' },
    fonts: { display: "'Bodoni Moda', Georgia, serif", body: "'DM Sans', ui-sans-serif, system-ui, sans-serif" },
    radius: 20,
  },
  // Papier Bleu — Matisse calm, aqua + navy (papier-gallery).
  papier: {
    palette: { bg: '#FAF3EB', fg: '#1A3C8F', muted: '#8FA6C4', accent: '#72D0E9', accent2: '#4FB8D8', surface: '#F1E7DA' },
    fonts: { display: "'Fraunces', Georgia, serif", body: "'Work Sans', ui-sans-serif, system-ui, sans-serif" },
    radius: 28,
  },
  // Riptide Cobalt — bold poster, high impact (riptide-surf).
  riptide: {
    palette: { bg: '#FDF0E0', fg: '#1A2240', muted: '#8A93B8', accent: '#375DFE', accent2: '#2741C0', surface: '#FFFFFF' },
    fonts: { display: "'Archivo Black', ui-sans-serif, system-ui, sans-serif", body: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif" },
    radius: 0,
  },
  // Salmon Stamp — clean stamp poster, salmon + green (salmon-plant-sale).
  salmon: {
    palette: { bg: '#FFFFFF', fg: '#000000', muted: '#9aa39c', accent: '#F0AE9E', accent2: '#049550', surface: '#FBF1EE' },
    fonts: { display: "'Archivo Black', ui-sans-serif, system-ui, sans-serif", body: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif" },
    radius: 6,
  },
  // Specimen Bold — type specimen, graphic, loud (specimen-type).
  specimen: {
    palette: { bg: '#F3F3F3', fg: '#2E302E', muted: '#6B6E6B', accent: '#3EC06A', accent2: '#FBEF4A', surface: '#E7E7E3' },
    fonts: { display: "'Archivo Black', ui-sans-serif, system-ui, sans-serif", body: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif" },
    radius: 0,
  },
  // Terminal — developer shiplog, green-on-ink mono (terminal-shiplog).
  terminal: {
    palette: { bg: '#0d1117', fg: '#e6edf3', muted: '#7d8590', accent: '#39d353', accent2: '#58a6ff', surface: '#10161e' },
    fonts: { display: "'JetBrains Mono', ui-monospace, 'SFMono-Regular', monospace", body: "'JetBrains Mono', ui-monospace, 'SFMono-Regular', monospace" },
    radius: 16,
  },
  // Vintage Editorial — witty, distinctive serif on cream (vintage-hottake).
  vintage: {
    palette: { bg: '#f5f3ee', fg: '#1a1a1a', muted: '#9b948a', accent: '#e8d4c0', accent2: '#c46a3f', surface: '#ece7dd' },
    fonts: { display: "'Fraunces', Georgia, serif", body: "'Work Sans', ui-sans-serif, system-ui, sans-serif" },
    radius: 8,
  },
  // Violet Marker — highlighter, violet + lime (violet-study).
  violet: {
    palette: { bg: '#FFFFFF', fg: '#000000', muted: '#666463', accent: '#C5A1FF', accent2: '#CFEE30', surface: '#FAFAF8' },
    fonts: { display: "'Archivo Black', 'Space Grotesk', system-ui, sans-serif", body: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif" },
    radius: 10,
  },
  // Creative Voltage — electric blue + neon yellow (voltage-night).
  voltage: {
    palette: { bg: '#1a1a2e', fg: '#ffffff', muted: '#8a8ab0', accent: '#0066ff', accent2: '#d4ff00', surface: '#23233f' },
    fonts: { display: "'Syne', ui-sans-serif, system-ui, sans-serif", body: "'Space Mono', ui-monospace, monospace" },
    radius: 24,
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

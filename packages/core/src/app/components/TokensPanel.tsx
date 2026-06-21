import { useEffect, useRef, useState } from 'react';
import type { DesignSystem } from '../../design';
import { putTokens, resetTokens } from '../lib/design-crud';
import { toast } from './ui/toast';
import { SelectMenu } from './ui/Menu';
import { Icon } from './icons';

/**
 * Live design-token panel — edit the design's palette / fonts / radius. Changes
 * preview instantly on the board(s) (by setting `--ox-*` vars) and commit to
 * `export const design` in the source (debounced); Reset removes the override.
 */
const PALETTE: { key: keyof DesignSystem['palette']; label: string; cssVar: string }[] = [
  { key: 'bg', label: 'Background', cssVar: '--ox-bg' },
  { key: 'fg', label: 'Foreground', cssVar: '--ox-fg' },
  { key: 'muted', label: 'Muted', cssVar: '--ox-muted' },
  { key: 'accent', label: 'Accent', cssVar: '--ox-accent' },
  { key: 'accent2', label: 'Accent 2', cssVar: '--ox-accent2' },
  { key: 'surface', label: 'Surface', cssVar: '--ox-surface' },
];

const FONT_PRESETS = [
  "'Poppins', ui-sans-serif, system-ui, sans-serif",
  "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
  "'Archivo', ui-sans-serif, system-ui, sans-serif",
  "'Fraunces', Georgia, serif",
  "'Playfair Display', Georgia, serif",
  "ui-monospace, 'JetBrains Mono', monospace",
  'ui-sans-serif, system-ui, -apple-system, sans-serif',
];
const fontName = (s: string) => s.split(',')[0].replace(/['"]/g, '').trim();

function setBoardVar(cssVar: string, value: string) {
  for (const b of document.querySelectorAll<HTMLElement>('[data-ox-board]')) b.style.setProperty(cssVar, value);
}

export function TokensPanel({ designId, design, onClose }: { designId: string; design: DesignSystem; onClose: () => void }) {
  const [draft, setDraft] = useState<DesignSystem>(design);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Re-sync the draft when the underlying design changes (HMR after a commit).
  useEffect(() => setDraft(design), [design]);

  const commit = (next: DesignSystem) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      putTokens(designId, next).catch((e) => toast.err(`Tokens: ${String((e as Error)?.message ?? e)}`));
    }, 250);
  };

  const setPalette = (key: keyof DesignSystem['palette'], cssVar: string, value: string) => {
    setBoardVar(cssVar, value);
    const next = { ...draft, palette: { ...draft.palette, [key]: value } };
    setDraft(next);
    commit(next);
  };
  const setFont = (slot: 'display' | 'body', value: string) => {
    setBoardVar(slot === 'display' ? '--ox-font-display' : '--ox-font-body', value);
    const next = { ...draft, fonts: { ...draft.fonts, [slot]: value } };
    setDraft(next);
    commit(next);
  };
  const setRadius = (value: number) => {
    setBoardVar('--ox-radius', `${value}px`);
    const next = { ...draft, radius: value };
    setDraft(next);
    commit(next);
  };

  return (
    <div className="ox-assets ox-tokens">
      <div className="ox-assets-head">
        <span>Design tokens</span>
        <div className="ox-assets-head-actions">
          <button
            type="button"
            className="ox-btn"
            onClick={async () => {
              try {
                await resetTokens(designId);
                toast.ok('Tokens reset');
              } catch (e) {
                toast.err(`Reset failed: ${String((e as Error)?.message ?? e)}`);
              }
            }}
          >
            Reset
          </button>
          <button type="button" className="ox-icon-btn" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        </div>
      </div>

      <div className="ox-tokens-body">
        <div className="ox-tokens-label">Palette</div>
        {PALETTE.map((p) => (
          <label key={p.key} className="ox-token-edit">
            <span className="ox-token-edit-swatch" style={{ background: draft.palette[p.key] }}>
              <input type="color" value={toHex(draft.palette[p.key])} onChange={(e) => setPalette(p.key, p.cssVar, e.target.value)} />
            </span>
            <span className="ox-token-edit-name">{p.label}</span>
            <code className="ox-token-edit-val">{draft.palette[p.key]}</code>
          </label>
        ))}

        <div className="ox-tokens-label">Type</div>
        <div className="ox-token-row2">
          <span>Display</span>
          <SelectMenu
            label="Display font"
            align="end"
            value={fontMatch(draft.fonts.display)}
            options={FONT_PRESETS.map((f) => ({ value: f, label: fontName(f) }))}
            onChange={(v) => setFont('display', v)}
          />
        </div>
        <div className="ox-token-row2">
          <span>Body</span>
          <SelectMenu
            label="Body font"
            align="end"
            value={fontMatch(draft.fonts.body)}
            options={FONT_PRESETS.map((f) => ({ value: f, label: fontName(f) }))}
            onChange={(v) => setFont('body', v)}
          />
        </div>

        <div className="ox-tokens-label">Shape</div>
        <label className="ox-token-row2">
          <span>Radius <code>{draft.radius}px</code></span>
          <input type="range" className="ox-range" min={0} max={64} step={1} value={draft.radius} onChange={(e) => setRadius(Number(e.target.value))} />
        </label>
      </div>
    </div>
  );
}

/** A color input needs `#rrggbb`; pass theme vars / names through as-is for display. */
function toHex(c: string): string {
  if (/^#[0-9a-f]{6}$/i.test(c)) return c;
  if (/^#[0-9a-f]{3}$/i.test(c)) return `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}`;
  return '#888888';
}
/** Snap an arbitrary font stack to the nearest preset (so the select shows a value). */
function fontMatch(stack: string): string {
  return FONT_PRESETS.find((f) => fontName(f) === fontName(stack)) ?? FONT_PRESETS[0];
}

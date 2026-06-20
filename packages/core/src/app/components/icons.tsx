import type { CSSProperties, ReactNode } from 'react';

/**
 * One coherent chrome icon set — a single stroke language (1.6px, round joins,
 * currentColor) so every toolbar/inspector/layer affordance matches, instead of
 * the old mix of Unicode glyphs, box-drawing chars, and a color emoji. Custom
 * geometric set (not Lucide/Feather defaults).
 */
export type IconName =
  | 'back' | 'forward' | 'minus' | 'plus' | 'caret' | 'close'
  | 'undo' | 'redo' | 'check' | 'warn' | 'comment' | 'contrast'
  | 'box' | 'text' | 'ellipse' | 'line' | 'image' | 'group' | 'spark' | 'dot';

const FILL: CSSProperties = { fill: 'currentColor', stroke: 'none' };

const PATHS: Record<IconName, ReactNode> = {
  back: <path d="M19 12H6M11 7l-5 5 5 5" />,
  forward: <path d="M5 12h13M13 7l5 5-5 5" />,
  minus: <path d="M6 12h12" />,
  plus: <path d="M12 6v12M6 12h12" />,
  caret: <path d="M7 10l5 5 5-5" />,
  close: <path d="M7 7l10 10M17 7L7 17" />,
  undo: <><path d="M4 9h10a5.5 5.5 0 0 1 0 11h-4" /><path d="M8 5L4 9l4 4" /></>,
  redo: <><path d="M20 9H10a5.5 5.5 0 0 0 0 11h4" /><path d="M16 5l4 4-4 4" /></>,
  check: <path d="M5 12.5l4 4.5L19 7" />,
  warn: <><path d="M12 4.5l8.5 15H3.5z" /><path d="M12 10v4" /><path d="M12 16.4v.2" /></>,
  comment: <><path d="M8 12h.01M12 12h.01M16 12h.01" /></>,
  contrast: <><circle cx="12" cy="12" r="8" /><path d="M12 4a8 8 0 0 1 0 16z" style={FILL} /></>,
  box: <rect x="4.5" y="4.5" width="15" height="15" rx="1.5" />,
  text: <path d="M6 7h12M12 7v11" />,
  ellipse: <circle cx="12" cy="12" r="7.5" />,
  line: <path d="M5 19L19 5" />,
  image: <><rect x="4.5" y="5.5" width="15" height="13" rx="1.5" /><circle cx="9" cy="10" r="1.2" style={FILL} /><path d="M5.5 16l3.5-3 3 2.5 4-4 3 3" /></>,
  group: <rect x="4.5" y="4.5" width="15" height="15" rx="1.5" strokeDasharray="3.5 2.5" />,
  spark: <path d="M12 4v16M5 8l14 8M19 8L5 16" />,
  dot: <circle cx="12" cy="12" r="3.5" style={FILL} />,
};

export function Icon({ name, size = 16, style }: { name: IconName; size?: number; style?: CSSProperties }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}

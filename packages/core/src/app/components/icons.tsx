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
  | 'box' | 'text' | 'ellipse' | 'line' | 'image' | 'group' | 'spark' | 'dot'
  | 'search' | 'grid' | 'palette'
  | 'alignLeft' | 'alignCenter' | 'alignRight' | 'italic' | 'plug'
  | 'alignTop' | 'alignMiddle' | 'alignBottom' | 'distH' | 'distV'
  | 'folder' | 'sliders' | 'trash';

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
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-3.8-3.8" /></>,
  grid: <><rect x="4.5" y="4.5" width="6" height="6" rx="1.2" /><rect x="13.5" y="4.5" width="6" height="6" rx="1.2" /><rect x="4.5" y="13.5" width="6" height="6" rx="1.2" /><rect x="13.5" y="13.5" width="6" height="6" rx="1.2" /></>,
  palette: <><circle cx="7" cy="12" r="2" style={FILL} /><circle cx="12" cy="12" r="2" style={FILL} /><circle cx="17" cy="12" r="2" style={FILL} /></>,
  alignLeft: <><path d="M4 6h16" /><path d="M4 12h10" /><path d="M4 18h13" /></>,
  alignCenter: <><path d="M4 6h16" /><path d="M7 12h10" /><path d="M5 18h14" /></>,
  alignRight: <><path d="M4 6h16" /><path d="M10 12h10" /><path d="M7 18h13" /></>,
  italic: <><path d="M11 5h6M7 19h6M14 5l-4 14" /></>,
  plug: <><path d="M9 3v5M15 3v5" /><path d="M7 8h10v3a5 5 0 0 1-10 0z" /><path d="M12 16v5" /></>,
  alignTop: <><path d="M4 5h16" /><path d="M9 5v10" /><path d="M15 5v6" /></>,
  alignMiddle: <><path d="M4 12h16" /><path d="M9 6v12" /><path d="M15 8v8" /></>,
  alignBottom: <><path d="M4 19h16" /><path d="M9 19v-10" /><path d="M15 19v-6" /></>,
  distH: <><path d="M4 4v16" /><path d="M20 4v16" /><path d="M11 8v8" /></>,
  distV: <><path d="M4 4h16" /><path d="M4 20h16" /><path d="M8 11h8" /></>,
  folder: <path d="M3.5 7.5a1.5 1.5 0 0 1 1.5-1.5h3.8l1.7 1.8H19a1.5 1.5 0 0 1 1.5 1.5v7.7A1.5 1.5 0 0 1 19 18.5H5a1.5 1.5 0 0 1-1.5-1.5z" />,
  sliders: <><path d="M5 6h14M5 12h14M5 18h14" /><circle cx="9" cy="6" r="2" style={FILL} /><circle cx="15" cy="12" r="2" style={FILL} /><circle cx="8" cy="18" r="2" style={FILL} /></>,
  trash: <path d="M5 7h14M10 7V5h4v2M6 7l.9 12.1a1 1 0 0 0 1 .9h8.2a1 1 0 0 0 1-.9L18 7M10 11v5M14 11v5" />,
};

export function Icon({
  name,
  size = 16,
  style,
  className,
}: { name: IconName; size?: number; style?: CSSProperties; className?: string }) {
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
      className={className}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}

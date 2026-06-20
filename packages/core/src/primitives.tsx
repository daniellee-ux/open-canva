import type { CSSProperties, ReactNode } from 'react';

/**
 * Object primitive kit — the component vocabulary agents author graphics with.
 * Every object is absolutely positioned on its artboard (or its containing
 * <Box>/<Group>) via numeric props in artboard pixels.
 *
 * Two design rules make the inspector work (PLAN / click-to-source):
 *  1. Each object emits `data-ox-obj` + `data-ox-x/y/w/h/rotate` so the inspector
 *     reads its EXACT current geometry without parsing source or guessing from
 *     computed layout. Drag/resize/rotate then write the corresponding prop back.
 *  2. Each object forwards `style` / `className`, so the inspector's style edits
 *     and authors' overrides reach the DOM through the component boundary.
 */

export interface ObjectProps {
  /** X position in artboard px, relative to the artboard (or containing box). */
  x?: number;
  /** Y position in artboard px. */
  y?: number;
  /** Width in artboard px. */
  w?: number;
  /** Height in artboard px. Optional for text (auto height). */
  h?: number;
  /** Rotation in degrees, around the object's center. */
  rotate?: number;
  /** Stacking order (CSS z-index). Later siblings paint on top by default. */
  z?: number;
  /** 0–1 opacity. */
  opacity?: number;
  className?: string;
  style?: CSSProperties;
}

type AnyData = Record<string, string | number | undefined>;

function objStyle(p: ObjectProps, extra: CSSProperties): CSSProperties {
  return {
    position: 'absolute',
    left: p.x ?? 0,
    top: p.y ?? 0,
    width: p.w,
    height: p.h,
    transform: p.rotate ? `rotate(${p.rotate}deg)` : undefined,
    transformOrigin: 'center',
    zIndex: p.z,
    opacity: p.opacity,
    ...extra,
    ...p.style,
  };
}

function objData(p: ObjectProps, type: string): AnyData {
  return {
    'data-ox-obj': '',
    'data-ox-type': type,
    'data-ox-x': p.x ?? 0,
    'data-ox-y': p.y ?? 0,
    'data-ox-w': p.w,
    'data-ox-h': p.h,
    'data-ox-rotate': p.rotate,
  };
}

function cn(base: string, extra?: string): string {
  return extra ? `${base} ${extra}` : base;
}

/* -------------------------------------------------------------------------- */

export interface BoxProps extends ObjectProps {
  /** Fill — a CSS color or gradient (e.g. `var(--ox-accent)`, `linear-gradient(...)`). */
  fill?: string;
  /** Corner radius in px. Defaults to the theme `--ox-radius` when omitted. */
  radius?: number | string;
  /** Border color. */
  borderColor?: string;
  /** Border width in px (default 0). */
  borderWidth?: number;
  /** Drop shadow CSS (e.g. `0 20px 60px rgba(0,0,0,.3)`). */
  shadow?: string;
  /** Center children with flex (handy for a labelled button/badge). */
  center?: boolean;
  children?: ReactNode;
}

/** A rectangle / container. Establishes a positioning context for its children. */
export function Box({
  fill,
  radius,
  borderColor,
  borderWidth,
  shadow,
  center,
  children,
  className,
  ...p
}: BoxProps) {
  return (
    <div
      {...objData(p, 'box')}
      className={cn('ox-obj ox-box', className)}
      style={objStyle(p, {
        background: fill,
        borderRadius: radius ?? 'var(--ox-radius)',
        border: borderWidth ? `${borderWidth}px solid ${borderColor ?? 'var(--ox-fg)'}` : undefined,
        boxShadow: shadow,
        display: center ? 'flex' : undefined,
        alignItems: center ? 'center' : undefined,
        justifyContent: center ? 'center' : undefined,
      })}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export interface TextProps extends ObjectProps {
  /** Font size in px. */
  size?: number;
  /** Font weight (100–900). */
  weight?: number;
  /** Text color. Defaults to `var(--ox-fg)`. */
  color?: string;
  /** Font family: a theme slot or an explicit CSS font stack. */
  font?: 'display' | 'body' | (string & {});
  align?: 'left' | 'center' | 'right';
  /** Vertical alignment within the box when `h` is set. */
  valign?: 'top' | 'center' | 'bottom';
  lineHeight?: number;
  letterSpacing?: number | string;
  italic?: boolean;
  uppercase?: boolean;
  /** Text shadow / glow CSS, e.g. `0 0 40px rgba(0,255,204,.6)`. */
  shadow?: string;
  children?: ReactNode;
}

/** A text object. Width sets the wrap measure; height is auto unless `h` is set. */
export function Text({
  size = 48,
  weight = 600,
  color,
  font = 'display',
  align = 'left',
  valign = 'top',
  lineHeight = 1.1,
  letterSpacing,
  italic,
  uppercase,
  shadow,
  children,
  className,
  ...p
}: TextProps) {
  const family =
    font === 'display' ? 'var(--ox-font-display)' : font === 'body' ? 'var(--ox-font-body)' : font;
  return (
    <div
      {...objData(p, 'text')}
      className={cn('ox-obj ox-text', className)}
      style={objStyle(p, {
        color: color ?? 'var(--ox-fg)',
        fontFamily: family,
        fontSize: size,
        fontWeight: weight,
        fontStyle: italic ? 'italic' : undefined,
        textAlign: align,
        lineHeight,
        letterSpacing,
        textShadow: shadow,
        textTransform: uppercase ? 'uppercase' : undefined,
        display: p.h ? 'flex' : undefined,
        flexDirection: p.h ? 'column' : undefined,
        justifyContent: p.h
          ? valign === 'center'
            ? 'center'
            : valign === 'bottom'
              ? 'flex-end'
              : 'flex-start'
          : undefined,
      })}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export interface EllipseProps extends ObjectProps {
  fill?: string;
  borderColor?: string;
  borderWidth?: number;
  shadow?: string;
  children?: ReactNode;
}

/** A circle / ellipse (a Box with a 50% radius). */
export function Ellipse({
  fill,
  borderColor,
  borderWidth,
  shadow,
  children,
  className,
  ...p
}: EllipseProps) {
  return (
    <div
      {...objData(p, 'ellipse')}
      className={cn('ox-obj ox-ellipse', className)}
      style={objStyle(p, {
        background: fill,
        borderRadius: '50%',
        border: borderWidth ? `${borderWidth}px solid ${borderColor ?? 'var(--ox-fg)'}` : undefined,
        boxShadow: shadow,
      })}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export interface LineProps extends ObjectProps {
  /** Stroke color. Defaults to `var(--ox-fg)`. */
  color?: string;
  /** Stroke thickness in px (default 2). */
  thickness?: number;
  /** Dash pattern, e.g. "8 6". */
  dash?: string;
}

/** A straight line / divider. Length comes from `w`; angle from `rotate`. */
export function Line({ color, thickness = 2, dash, h, className, ...p }: LineProps) {
  // The line's thickness IS its height, so a vertical/corner inspector resize
  // commits an `h` prop — honor it (h wins) instead of discarding it, which would
  // leave a dead `h` in source and let a corner drag mis-position the line.
  const stroke = h ?? thickness;
  const geom = { ...p, h: stroke };
  // Paint the stroke via `currentColor` so the inspector's live `style.color`
  // preview (and its current-color readback) reflects the line, not inherited text.
  const strokeColor = color ?? 'var(--ox-fg)';
  if (dash) {
    return (
      <div
        {...objData(geom, 'line')}
        className={cn('ox-obj ox-line', className)}
        style={objStyle(geom, {
          color: strokeColor,
          borderTop: `${stroke}px dashed currentColor`,
          backgroundClip: undefined,
        })}
      />
    );
  }
  return (
    <div
      {...objData(geom, 'line')}
      className={cn('ox-obj ox-line', className)}
      style={objStyle(geom, { color: strokeColor, background: 'currentColor' })}
    />
  );
}

/* -------------------------------------------------------------------------- */

export interface ImageObjectProps extends ObjectProps {
  src: string;
  alt?: string;
  /** How the image fills its box. */
  fit?: 'cover' | 'contain' | 'fill';
  radius?: number | string;
}

/** An image object. Place under `designs/<id>/assets/` and reference by path. */
export function ImageObject({
  src,
  alt = '',
  fit = 'cover',
  radius,
  className,
  ...p
}: ImageObjectProps) {
  return (
    <div
      {...objData(p, 'image')}
      className={cn('ox-obj ox-image', className)}
      style={objStyle(p, { borderRadius: radius ?? 0, overflow: 'hidden' })}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        style={{ width: '100%', height: '100%', objectFit: fit, display: 'block' }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export interface GroupProps extends ObjectProps {
  children?: ReactNode;
}

/** A transparent container: move it and everything inside moves together. */
export function Group({ children, className, ...p }: GroupProps) {
  return (
    <div
      {...objData(p, 'group')}
      className={cn('ox-obj ox-group', className)}
      style={objStyle(p, {})}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export interface IconProps extends ObjectProps {
  /** An emoji or single glyph, or pass SVG/markup as children. */
  glyph?: string;
  size?: number;
  color?: string;
  children?: ReactNode;
}

/** A simple glyph/emoji or inline-SVG object. */
export function Icon({ glyph, size = 64, color, children, className, ...p }: IconProps) {
  return (
    <div
      {...objData(p, 'icon')}
      className={cn('ox-obj ox-icon', className)}
      style={objStyle(p, {
        fontSize: size,
        lineHeight: 1,
        color: color ?? 'var(--ox-fg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      {children ?? glyph}
    </div>
  );
}

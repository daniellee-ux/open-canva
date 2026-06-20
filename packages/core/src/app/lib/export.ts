import boardCss from '../board.css?raw';

/**
 * Export pipeline. A design is HTML/CSS, so we serialize ONE mounted board (the
 * active artboard) into an SVG `<foreignObject>` — a single-tree serialize, not
 * per-object capture (trap #7). That SVG is the SVG export; rasterizing it to a
 * canvas gives PNG; embedding the PNG in a one-page document gives PDF.
 *
 * Heavy deps (jspdf) are imported lazily, only when the user exports (trap #5).
 */

const RESET = `
  *{box-sizing:border-box;margin:0;padding:0}
  .ox-board{position:relative;overflow:hidden;font-family:var(--ox-font-body)}
`;

const FONT_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,500;0,600;0,700;0,800;1,600&family=Playfair+Display:ital,wght@0,500;0,700;0,900;1,600&display=swap');";

/**
 * Inline the app's web fonts as base64 @font-face rules. An SVG drawn into a
 * <canvas> via an <img> renders in an isolated context that does NOT inherit the
 * document's loaded fonts (strictest in WebKit), so for faithful PNG/PDF the font
 * bytes must live inside the SVG. Best-effort: falls back to FONT_IMPORT on any
 * failure (which still renders correctly when the .svg is opened in a browser).
 */
/** The font families actually used by the objects on this board (lower-cased). */
function usedFontFamilies(board: HTMLElement): Set<string> {
  const out = new Set<string>();
  const add = (el: Element) => {
    const fam = getComputedStyle(el).fontFamily.split(',')[0]?.trim().replace(/^['"]|['"]$/g, '');
    if (fam) out.add(fam.toLowerCase());
  };
  add(board);
  board.querySelectorAll('*').forEach(add);
  return out;
}

async function inlineFontFaces(board: HTMLElement): Promise<string> {
  try {
    const link = [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].find(
      (l) => l.href.includes('fonts.googleapis.com'),
    );
    if (!link) return FONT_IMPORT;
    const used = usedFontFamilies(board);
    const cssText = await (await fetch(link.href)).text();
    // Keep only the @font-face blocks for families this board actually renders.
    const blocks = (cssText.match(/@font-face\s*{[^}]*}/g) ?? []).filter((b) => {
      const m = /font-family:\s*['"]?([^;'"]+)/i.exec(b);
      return m && used.has(m[1].trim().toLowerCase());
    });
    if (!blocks.length) return FONT_IMPORT;
    const urls = [...new Set(blocks.flatMap((b) => [...b.matchAll(/url\((https:\/\/[^)]+\.woff2)\)/g)].map((m) => m[1])))];
    const map = new Map<string, string>();
    await Promise.all(
      urls.map(async (u) => {
        const buf = await (await fetch(u)).arrayBuffer();
        const bytes = new Uint8Array(buf);
        let bin = '';
        for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
        map.set(u, `data:font/woff2;base64,${btoa(bin)}`);
      }),
    );
    return blocks
      .map((b) => b.replace(/url\((https:\/\/[^)]+\.woff2)\)/g, (m, u) => (map.has(u) ? `url(${map.get(u)})` : m)))
      .join('\n');
  } catch {
    return FONT_IMPORT;
  }
}

function download(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/** Fetch every <img> in the clone and inline it as a data URL (so PNG isn't tainted). */
async function inlineImages(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll('img'));
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute('src');
      if (!src || src.startsWith('data:')) return;
      try {
        const res = await fetch(src);
        const blob = await res.blob();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const fr = new FileReader();
          fr.onload = () => resolve(fr.result as string);
          fr.onerror = reject;
          fr.readAsDataURL(blob);
        });
        img.setAttribute('src', dataUrl);
      } catch {
        /* best-effort; leave the original src */
      }
    }),
  );
}

async function buildBoardSvg(board: HTMLElement, w: number, h: number, forRaster: boolean): Promise<string> {
  const clone = board.cloneNode(true) as HTMLElement;
  clone.style.transform = 'none';
  clone.style.margin = '0';
  clone.style.width = `${w}px`;
  clone.style.height = `${h}px`;
  // Drop inspector/editor-only artifacts from the serialized output.
  clone.querySelectorAll('.ox-peek').forEach((el) => el.classList.remove('ox-peek'));
  let fontCss = FONT_IMPORT;
  if (forRaster) {
    await inlineImages(clone);
    fontCss = await inlineFontFaces(board);
  }
  const css = `${fontCss}${RESET}${boardCss}`;
  const xhtml = new XMLSerializer().serializeToString(clone);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<foreignObject x="0" y="0" width="${w}" height="${h}">
<div xmlns="http://www.w3.org/1999/xhtml"><style>${css}</style>${xhtml}</div>
</foreignObject>
</svg>`;
}

export async function exportSvg(board: HTMLElement, w: number, h: number, filename: string) {
  await (document as any).fonts?.ready;
  const svg = await buildBoardSvg(board, w, h, false);
  download(`${filename}.svg`, new Blob([svg], { type: 'image/svg+xml' }));
}

async function rasterize(board: HTMLElement, w: number, h: number, scale: number): Promise<Blob> {
  await (document as any).fonts?.ready;
  const svg = await buildBoardSvg(board, w, h, true);
  const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  const img = new Image();
  img.decoding = 'sync';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Could not rasterize the board'));
    img.src = svgUrl;
  });
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No 2D context');
  ctx.scale(scale, scale);
  ctx.drawImage(img, 0, 0);
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'),
  );
}

export async function exportPng(board: HTMLElement, w: number, h: number, filename: string, scale = 2) {
  const blob = await rasterize(board, w, h, scale);
  download(`${filename}.png`, blob);
}

/** Same raster as PNG export, returned as a data URL (used for fidelity checks). */
export async function boardToPngDataUrl(board: HTMLElement, w: number, h: number, scale = 2): Promise<string> {
  const blob = await rasterize(board, w, h, scale);
  return new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  });
}

export async function exportPdf(board: HTMLElement, w: number, h: number, filename: string) {
  const blob = await rasterize(board, w, h, 2);
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  });
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: w >= h ? 'landscape' : 'portrait', unit: 'px', format: [w, h] });
  pdf.addImage(dataUrl, 'PNG', 0, 0, w, h);
  pdf.save(`${filename}.pdf`);
}

/** Client for the dev-only assets API (`/__ox/assets`). */
export interface AssetFile {
  name: string;
  ext: string;
  size: number;
  mtime?: number;
  isImage: boolean;
  url: string;
  /** How many times the design references this asset (0 = unused). */
  uses?: number;
}

export async function listAssets(design: string): Promise<{ dir: string; files: AssetFile[] }> {
  const res = await fetch(`/__ox/assets?design=${encodeURIComponent(design)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return { dir: data.dir, files: data.files ?? [] };
}

/** Lowercase, dash-separate, and keep a sane image extension. */
function sanitizeName(name: string): string {
  const dot = name.lastIndexOf('.');
  const base =
    (dot > 0 ? name.slice(0, dot) : name)
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'asset';
  const ext = (dot > 0 ? name.slice(dot + 1) : '').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
  return `${base}.${ext}`;
}

function bump(name: string): string {
  const m = /^(.*?)(?:-(\d+))?(\.[^.]+)$/.exec(name);
  if (!m) return `2-${name}`;
  const n = m[2] ? Number(m[2]) + 1 : 2;
  return `${m[1]}-${n}${m[3]}`;
}

/** Upload a File, auto-renaming past any name collision. Returns the stored asset. */
export async function uploadAsset(design: string, file: File): Promise<AssetFile> {
  let name = sanitizeName(file.name);
  for (let i = 0; i < 50; i++) {
    const res = await fetch(`/__ox/assets/${encodeURIComponent(design)}/${encodeURIComponent(name)}`, {
      method: 'POST',
      body: file,
      headers: { 'content-type': file.type || 'application/octet-stream', 'x-opencanva-write': '1' },
    });
    if (res.status === 409) {
      name = bump(name);
      continue;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
    return data.asset as AssetFile;
  }
  throw new Error('Too many filename collisions');
}

export async function renameAsset(design: string, from: string, to: string): Promise<AssetFile> {
  const res = await fetch(`/__ox/assets/${encodeURIComponent(design)}/${encodeURIComponent(from)}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', 'x-opencanva-write': '1' },
    body: JSON.stringify({ to: sanitizeName(to) }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data.asset as AssetFile;
}

export async function deleteAsset(design: string, name: string): Promise<void> {
  const res = await fetch(`/__ox/assets/${encodeURIComponent(design)}/${encodeURIComponent(name)}`, {
    method: 'DELETE',
    headers: { 'x-opencanva-write': '1' },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `HTTP ${res.status}`);
  }
}

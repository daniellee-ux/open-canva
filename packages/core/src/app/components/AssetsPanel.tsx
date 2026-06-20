import { useEffect, useState } from 'react';

/**
 * Assets panel — lists files under `designs/<id>/assets/` (logos, photos,
 * textures) so the author/agent can see what a design has to work with. Read-only:
 * shows the path to drop into an `<ImageObject src="…" />`.
 */
interface AssetFile {
  name: string;
  ext: string;
  size: number;
  isImage: boolean;
  url: string;
}

export function AssetsPanel({ designId, onClose }: { designId: string; onClose: () => void }) {
  const [data, setData] = useState<{ dir: string; files: AssetFile[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/__ox/assets?design=${encodeURIComponent(designId)}`)
      .then((r) => r.json())
      .then((d) => (d.error ? setError(d.error) : setData(d)))
      .catch((e) => setError(String(e)));
  }, [designId]);

  return (
    <div className="ox-assets">
      <div className="ox-assets-head">
        <span>Assets</span>
        <button type="button" className="ox-icon-btn" onClick={onClose}>
          ✕
        </button>
      </div>
      {error ? <div className="ox-assets-empty">{error}</div> : null}
      {data ? (
        <>
          <div className="ox-assets-dir">
            <code>{data.dir}/</code>
          </div>
          {data.files.length === 0 ? (
            <div className="ox-assets-empty">
              No assets. Drop images in <code>{data.dir}/</code> and reference them with{' '}
              <code>&lt;ImageObject src="./assets/photo.jpg" /&gt;</code>.
            </div>
          ) : (
            <ul className="ox-assets-list">
              {data.files.map((f) => (
                <li key={f.name}>
                  {f.isImage ? (
                    <img src={f.url} alt={f.name} className="ox-asset-thumb" />
                  ) : (
                    <span className="ox-asset-thumb ox-asset-thumb--file">.{f.ext}</span>
                  )}
                  <span className="ox-asset-name">{f.name}</span>
                  <span className="ox-asset-size">{(f.size / 1024).toFixed(0)} KB</span>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        !error && <div className="ox-assets-empty">Loading…</div>
      )}
    </div>
  );
}

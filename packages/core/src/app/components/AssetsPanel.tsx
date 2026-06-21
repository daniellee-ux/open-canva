import { useCallback, useEffect, useRef, useState } from 'react';
import { type AssetFile, deleteAsset, listAssets, renameAsset, uploadAsset } from '../lib/assets';
import { toast } from './ui/toast';
import { Icon } from './icons';

/**
 * Assets panel — browse + manage `designs/<id>/assets/`. Drag-drop or pick files
 * to upload, rename or delete in place, and copy the `./assets/…` import path.
 */
export function AssetsPanel({ designId, onClose }: { designId: string; onClose: () => void }) {
  const [files, setFiles] = useState<AssetFile[] | null>(null);
  const [dir, setDir] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [renaming, setRenaming] = useState<{ name: string; value: string } | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(() => {
    listAssets(designId)
      .then((d) => {
        setDir(d.dir);
        setFiles(d.files);
        setError(null);
      })
      .catch((e) => setError(String(e?.message ?? e)));
  }, [designId]);

  useEffect(() => {
    reload();
    const hot = import.meta.hot;
    const on = (d: { design?: string }) => {
      if (!d || d.design === designId) reload();
    };
    hot?.on('opencanva:assets-changed', on);
    return () => hot?.off('opencanva:assets-changed', on);
  }, [designId, reload]);

  const doUpload = useCallback(
    async (list: FileList | File[]) => {
      const arr = [...list].filter((f) => /^image\//.test(f.type) || /\.(png|jpe?g|gif|svg|webp|avif)$/i.test(f.name));
      if (!arr.length) {
        toast.err('Only image files can be uploaded');
        return;
      }
      setUploading(true);
      try {
        for (const f of arr) await uploadAsset(designId, f);
        toast.ok(arr.length > 1 ? `Uploaded ${arr.length} files` : `Uploaded ${arr[0].name}`);
        reload();
      } catch (err) {
        toast.err(`Upload failed: ${String((err as Error)?.message ?? err)}`);
      } finally {
        setUploading(false);
      }
    },
    [designId, reload],
  );

  const submitRename = useCallback(async () => {
    if (!renaming) return;
    const { name, value } = renaming;
    setRenaming(null);
    if (!value.trim() || value === name) return;
    try {
      await renameAsset(designId, name, value.trim());
      toast.ok('Renamed');
      reload();
    } catch (err) {
      toast.err(`Rename failed: ${String((err as Error)?.message ?? err)}`);
    }
  }, [renaming, designId, reload]);

  const doDelete = useCallback(
    async (name: string) => {
      setConfirmDel(null);
      try {
        await deleteAsset(designId, name);
        toast.ok(`Deleted ${name}`);
        reload();
      } catch (err) {
        toast.err(`Delete failed: ${String((err as Error)?.message ?? err)}`);
      }
    },
    [designId, reload],
  );

  return (
    <div
      className={`ox-assets${dragging ? ' is-dragging' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files.length) void doUpload(e.dataTransfer.files);
      }}
    >
      <div className="ox-assets-head">
        <span>Assets{files ? ` · ${files.length}` : ''}</span>
        <div className="ox-assets-head-actions">
          <button type="button" className="ox-btn ox-btn--primary" disabled={uploading} onClick={() => inputRef.current?.click()}>
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
          <button type="button" className="ox-icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files?.length) void doUpload(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {error ? <div className="ox-assets-empty">{error}</div> : null}

      {files ? (
        <>
          <div className="ox-assets-dir">
            <code>{dir}/</code>
          </div>
          {files.length === 0 ? (
            <div className="ox-assets-empty">
              No assets yet. <strong>Drop images here</strong> or use Upload, then reference them with{' '}
              <code>&lt;ImageObject src="./assets/photo.jpg" /&gt;</code>.
            </div>
          ) : (
            <ul className="ox-assets-list">
              {files.map((f) => (
                <li key={f.name}>
                  {f.isImage ? (
                    <img src={f.url} alt={f.name} className="ox-asset-thumb" />
                  ) : (
                    <span className="ox-asset-thumb ox-asset-thumb--file">.{f.ext}</span>
                  )}
                  {renaming?.name === f.name ? (
                    <input
                      className="ox-asset-rename"
                      // biome-ignore lint/a11y/noAutofocus: inline rename field
                      autoFocus
                      value={renaming.value}
                      onChange={(e) => setRenaming({ name: f.name, value: e.target.value })}
                      onBlur={submitRename}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') submitRename();
                        else if (e.key === 'Escape') setRenaming(null);
                      }}
                    />
                  ) : (
                    <button
                      type="button"
                      className="ox-asset-name"
                      title="Copy import path"
                      onClick={() => {
                        void navigator.clipboard?.writeText(`./assets/${f.name}`);
                        toast.ok(`Copied ./assets/${f.name}`);
                      }}
                    >
                      {f.name}
                    </button>
                  )}
                  {f.uses === 0 ? <span className="ox-asset-badge" title="Not referenced by this design">unused</span> : null}
                  {confirmDel === f.name ? (
                    <span className="ox-asset-confirm">
                      <button type="button" className="ox-asset-act ox-asset-act--danger" onClick={() => doDelete(f.name)}>Delete?</button>
                      <button type="button" className="ox-asset-act" onClick={() => setConfirmDel(null)}>No</button>
                    </span>
                  ) : (
                    <span className="ox-asset-row-actions">
                      <button type="button" className="ox-asset-act" title="Rename" onClick={() => setRenaming({ name: f.name, value: f.name })}><Icon name="text" size={13} /></button>
                      <button type="button" className="ox-asset-act ox-asset-act--danger" title="Delete" onClick={() => setConfirmDel(f.name)}><Icon name="close" size={13} /></button>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        !error && <div className="ox-assets-empty">Loading…</div>
      )}

      {dragging ? <div className="ox-assets-drop">Drop to upload</div> : null}
    </div>
  );
}

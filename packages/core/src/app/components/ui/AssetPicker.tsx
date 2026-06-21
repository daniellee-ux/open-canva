import { useEffect, useRef, useState } from 'react';
import { type AssetFile, listAssets, uploadAsset } from '../../lib/assets';
import { Dialog } from './Dialog';
import { toast } from './toast';

/** Pick (or upload) an image asset; returns its `./assets/<name>` import path. */
export function AssetPicker({
  open,
  designId,
  onClose,
  onPick,
}: {
  open: boolean;
  designId: string;
  onClose: () => void;
  onPick: (src: string) => void;
}) {
  const [files, setFiles] = useState<AssetFile[]>([]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = () =>
    listAssets(designId)
      .then((d) => setFiles(d.files.filter((f) => f.isImage)))
      .catch(() => setFiles([]));

  useEffect(() => {
    if (open) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, designId]);

  const upload = async (list: FileList) => {
    setBusy(true);
    try {
      for (const f of [...list]) await uploadAsset(designId, f);
      await load();
      toast.ok('Uploaded');
    } catch (e) {
      toast.err(`Upload failed: ${String((e as Error)?.message ?? e)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      eyebrow="Replace image"
      title="Pick an asset"
      width={460}
      autoFocus={false}
      footer={
        <>
          <button type="button" className="ox-btn" onClick={onClose}>Cancel</button>
          <button type="button" className="ox-btn ox-btn--primary" disabled={busy} onClick={() => inputRef.current?.click()}>
            {busy ? 'Uploading…' : 'Upload new'}
          </button>
        </>
      }
    >
      {files.length === 0 ? (
        <div className="ox-picker-empty">No images in <code>designs/{designId}/assets/</code> yet — upload one.</div>
      ) : (
        <div className="ox-picker-grid">
          {files.map((f) => (
            <button key={f.name} type="button" className="ox-picker-item" title={f.name} onClick={() => onPick(`./assets/${f.name}`)}>
              <img src={f.url} alt={f.name} />
              <span>{f.name}</span>
            </button>
          ))}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files?.length) void upload(e.target.files);
          e.target.value = '';
        }}
      />
    </Dialog>
  );
}

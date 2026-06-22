import { useCallback, useEffect, useState } from 'react';

export interface Folder {
  id: string;
  name: string;
  icon?: string;
}
export interface FoldersManifest {
  folders: Folder[];
  assignments: Record<string, string>;
}

async function call(url: string, method: string, body?: unknown): Promise<any> {
  const res = await fetch(url, {
    method,
    headers: { 'content-type': 'application/json', 'x-opencanva-write': '1' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data;
}

export const getFolders = (): Promise<FoldersManifest> => call('/__ox/folders', 'GET');
export const createFolder = (name: string): Promise<{ id: string }> => call('/__ox/folders', 'POST', { name });
export const renameFolder = (id: string, name: string) => call(`/__ox/folders/${encodeURIComponent(id)}`, 'PATCH', { name });
export const deleteFolder = (id: string) => call(`/__ox/folders/${encodeURIComponent(id)}`, 'DELETE');
export const assignDesign = (design: string, folder: string | null) => call('/__ox/folders/assign', 'PUT', { design, folder });

/** Live folders manifest — refetches when any folder op fires the change event. */
export function useFolders(): { manifest: FoldersManifest; reload: () => void } {
  const [manifest, setManifest] = useState<FoldersManifest>({ folders: [], assignments: {} });
  const reload = useCallback(() => {
    getFolders()
      .then(setManifest)
      .catch(() => {});
  }, []);
  useEffect(() => {
    reload();
    const hot = import.meta.hot;
    hot?.on('opencanva:folders-changed', reload);
    return () => hot?.off('opencanva:folders-changed', reload);
  }, [reload]);
  return { manifest, reload };
}

/** Client for the design lifecycle API (`/__ox/design`, `/__ox/board`). */
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

export const renameDesign = (id: string, title: string) =>
  call(`/__ox/design/${encodeURIComponent(id)}`, 'PATCH', { title });
export const duplicateDesign = (id: string): Promise<{ id: string }> =>
  call(`/__ox/design/${encodeURIComponent(id)}/duplicate`, 'POST');
export const deleteDesign = (id: string) => call(`/__ox/design/${encodeURIComponent(id)}`, 'DELETE');

export const duplicateBoard = (id: string, index: number) =>
  call(`/__ox/board/${encodeURIComponent(id)}/${index}/duplicate`, 'POST');
export const deleteBoard = (id: string, index: number) =>
  call(`/__ox/board/${encodeURIComponent(id)}/${index}`, 'DELETE');
export const reorderBoards = (id: string, order: number[]) =>
  call(`/__ox/board/${encodeURIComponent(id)}/reorder`, 'PUT', { order });

export const putTokens = (id: string, design: unknown) =>
  call(`/__ox/design/${encodeURIComponent(id)}/tokens`, 'PUT', { design });
export const resetTokens = (id: string) =>
  call(`/__ox/design/${encodeURIComponent(id)}/tokens/reset`, 'POST');

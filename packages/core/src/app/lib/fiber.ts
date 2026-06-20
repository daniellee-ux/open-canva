/**
 * Source resolution via injected `data-ox-loc` tags, read through the React fiber
 * chain. Walk up from the clicked DOM node and return the first fiber whose props
 * carry a `data-ox-loc` — the nearest JSX authored under designs/, in whatever
 * file. Reading from PROPS (not the DOM, not `_debugSource`) is what makes it
 * cross-component and cross-file: a host <div data-ox-obj> rendered by <Box> has
 * no tag, but the <Box> usage's fiber does.
 */

export interface CanvaSource {
  rel: string;
  line: number;
  column: number;
  tag: string;
}

type Fiber = {
  return: Fiber | null;
  type: unknown;
  memoizedProps?: Record<string, unknown> | null;
};

function getFiber(node: Element): Fiber | null {
  for (const key of Object.keys(node)) {
    if (key.startsWith('__reactFiber$') || key.startsWith('__reactInternalInstance$')) {
      return (node as unknown as Record<string, Fiber>)[key];
    }
  }
  return null;
}

function tagOf(fiber: Fiber): string {
  if (typeof fiber.type === 'string') return fiber.type;
  const t = fiber.type as { displayName?: string; name?: string } | null;
  return t?.displayName || t?.name || 'Component';
}

export function findCanvaSource(node: Element): CanvaSource | null {
  let fiber = getFiber(node);
  while (fiber) {
    const loc = fiber.memoizedProps?.['data-ox-loc'];
    if (typeof loc === 'string') {
      const m = /^(.*):(\d+):(\d+)$/.exec(loc);
      if (m) return { rel: m[1], line: Number(m[2]), column: Number(m[3]), tag: tagOf(fiber) };
    }
    fiber = fiber.return;
  }
  return null;
}

import { type Context, createContext, useContext, type ReactNode } from 'react';

/**
 * The canvas analog of open-slide's page-context — exposes "which board am I" to
 * objects that want it (e.g. a page-number badge in a carousel).
 *
 * Keyed on globalThis (trap #1): a design imports `useSceneInfo` via the package
 * specifier `@opencanva/core` while the runtime imports `SceneProvider`
 * relatively, so this module can be evaluated twice. Caching the Context on
 * globalThis guarantees both copies share ONE context object — otherwise the
 * provider and consumer never connect and the hook silently returns defaults.
 */
type SceneInfo = { index: number; total: number };

const KEY = Symbol.for('opencanva.scene-context');
const store = globalThis as unknown as Record<symbol, Context<SceneInfo>>;
const SceneContext: Context<SceneInfo> =
  store[KEY] ?? (store[KEY] = createContext<SceneInfo>({ index: 0, total: 1 }));

export function SceneProvider({
  index,
  total,
  children,
}: SceneInfo & { children: ReactNode }) {
  return <SceneContext.Provider value={{ index, total }}>{children}</SceneContext.Provider>;
}

/** Returns the 1-based ordinal of the current board and the total count. */
export function useSceneInfo(): { current: number; total: number } {
  const { index, total } = useContext(SceneContext);
  return { current: index + 1, total };
}

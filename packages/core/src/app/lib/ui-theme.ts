import { useCallback, useEffect, useState } from 'react';

/**
 * Editor-chrome light/dark theme. Light is the default; the inline boot script in
 * index.html only opts into dark (so there's no flash for returning dark users).
 * The choice is applied as `data-ui-theme` on <html> and persisted to localStorage.
 * Independent of the per-design `--ox-*` theme that renders on the canvas.
 */
export type UiTheme = 'light' | 'dark';

const STORAGE_KEY = 'ox-ui-theme';

function readTheme(): UiTheme {
  return document.documentElement.getAttribute('data-ui-theme') === 'dark' ? 'dark' : 'light';
}

export function useUiTheme(): { theme: UiTheme; toggle: () => void } {
  const [theme, setTheme] = useState<UiTheme>(readTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.setAttribute('data-ui-theme', 'dark');
    else root.removeAttribute('data-ui-theme');
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* storage unavailable (private mode) — keep the in-memory choice */
    }
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#0a0b0e' : '#f4f5f8');
  }, [theme]);

  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);
  return { theme, toggle };
}

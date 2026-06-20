import { useEffect, useMemo, useRef, useState } from 'react';
import config from 'virtual:opencanva/config';
import { designIds } from 'virtual:opencanva/designs';
import { designPresets, designToCssVars, resolveDesign } from '../design';
import type { CanvaSource } from './lib/fiber';
import { useDesignModule } from './lib/use-design-module';
import { useViewport } from './lib/viewport';
import { boardToPngDataUrl, exportPdf, exportPng, exportSvg } from './lib/export';
import { Stage, layoutBoards } from './components/Stage';
import { Inspector } from './components/Inspector';
import { LayersPanel } from './components/LayersPanel';
import { AssetsPanel } from './components/AssetsPanel';

const isDev = import.meta.env.DEV;

function navigate(to: string) {
  window.history.pushState({}, '', to);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function usePath(): string {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const on = () => setPath(window.location.pathname);
    window.addEventListener('popstate', on);
    return () => window.removeEventListener('popstate', on);
  }, []);
  return path;
}

export function App() {
  const path = usePath();
  const match = /^\/d\/([^/]+)/.exec(path);
  if (match) return <DesignPage id={decodeURIComponent(match[1])} />;
  if (path === '/themes') return <ThemesPage />;
  if (!config.build.showDesignBrowser && designIds.length) return <DesignPage id={designIds[0]} />;
  return <Home />;
}

function Home() {
  return (
    <div className="ox-home">
      <div className="ox-home-inner">
        <div className="ox-home-badge">agent-native graphic design</div>
        <h1 className="ox-home-title">
          OpenCanva<span className="ox-dot">.</span>
        </h1>
        <p className="ox-home-sub">
          Design graphics as code. Describe it to your agent, click any object to nudge it, export to
          PNG / SVG / PDF.{' '}
          <a className="ox-home-link" href="/themes" onClick={(e) => { e.preventDefault(); navigate('/themes'); }}>
            Themes →
          </a>
        </p>
        {designIds.length === 0 ? (
          <p className="ox-home-empty">
            No designs yet. Create <code>designs/&lt;id&gt;/index.tsx</code> and it appears here.
          </p>
        ) : (
          <ul className="ox-home-list">
            {designIds.map((id) => (
              <li key={id}>
                <a href={`/d/${encodeURIComponent(id)}`} onClick={(e) => { e.preventDefault(); navigate(`/d/${encodeURIComponent(id)}`); }}>
                  <span className="ox-home-id">{id}</span>
                  <span className="ox-home-arrow">→</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ThemesPage() {
  const names = Object.keys(designPresets);
  return (
    <div className="ox-themes">
      <header className="ox-toolbar">
        <a className="ox-icon-btn" href="/" title="Library" onClick={(e) => { e.preventDefault(); navigate('/'); }}>←</a>
        <span className="ox-brand">OpenCanva<span className="ox-dot">.</span></span>
        <span className="ox-doc-title">Themes</span>
      </header>
      <div className="ox-themes-grid">
        {names.map((name) => {
          const d = designPresets[name];
          return (
            <div key={name} className="ox-theme-card">
              <div className="ox-theme-swatch" style={{ ...designToCssVars(d), background: 'var(--ox-bg)' }}>
                <div className="ox-theme-title" style={{ color: 'var(--ox-fg)', fontFamily: 'var(--ox-font-display)' }}>
                  Aa
                </div>
                <div className="ox-theme-dots">
                  <span style={{ background: 'var(--ox-accent)' }} />
                  <span style={{ background: 'var(--ox-accent2)' }} />
                  <span style={{ background: 'var(--ox-surface)' }} />
                </div>
              </div>
              <div className="ox-theme-name">
                {name}
                <code>theme: '{name}'</code>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DesignPage({ id }: { id: string }) {
  const { design: mod, error } = useDesignModule(id);
  const [inspect, setInspect] = useState(false);
  const [assets, setAssets] = useState(false);
  const [activeBoard, setActiveBoard] = useState(0);
  const [selection, setSelection] = useState<CanvaSource | null>(null);
  const [revision, setRevision] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Bump on every HMR re-import so the inspector can re-bind its selection to the
  // freshly mounted DOM nodes (the old ones are detached).
  useEffect(() => setRevision((r) => r + 1), [mod]);

  const showUi = config.build.showDesignUi;
  const scenes = mod?.default ?? [];
  const title = mod?.meta?.title ?? id;
  const design = useMemo(() => resolveDesign({ design: mod?.design, theme: mod?.meta?.theme }), [mod]);
  const layout = useMemo(() => layoutBoards(scenes, mod?.artboard), [scenes, mod]);
  const vp = useViewport(stageRef, { w: layout.w, h: layout.h });

  // Report the editor's cursor to .opencanva/current.json (the current-design skill).
  useEffect(() => {
    const hot = import.meta.hot;
    if (!hot || !mod) return;
    hot.send('opencanva:current', {
      designId: id,
      title,
      activeBoard,
      board: scenes[activeBoard]?.id ?? `scene-${activeBoard + 1}`,
      zoom: Math.round(vp.zoom * 100) / 100,
      view: inspect ? 'inspect' : 'view',
      selection: selection
        ? { rel: selection.rel, line: selection.line, column: selection.column, tag: selection.tag }
        : null,
    });
  }, [id, title, activeBoard, vp.zoom, inspect, selection, mod, scenes]);

  if (error) {
    return (
      <div className="ox-msg">
        <a className="ox-back" href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>← Library</a>
        <h2>Failed to load “{id}”</h2>
        <pre className="ox-err">{error}</pre>
      </div>
    );
  }
  if (!mod) return <div className="ox-msg"><span className="ox-loading">Loading {id}…</span></div>;

  const doExport = (kind: 'png' | 'svg' | 'pdf') => {
    const boards = document.querySelectorAll<HTMLElement>('.ox-board');
    const board = boards[activeBoard] ?? boards[0];
    if (!board) return;
    const at = layout.boards[activeBoard]?.artboard ?? layout.boards[0]?.artboard;
    if (!at) return;
    const fname = `${id}${scenes.length > 1 ? `-${activeBoard + 1}` : ''}`;
    if (kind === 'png') void exportPng(board, at.w, at.h, fname);
    else if (kind === 'svg') void exportSvg(board, at.w, at.h, fname);
    else void exportPdf(board, at.w, at.h, fname);
  };

  // Dev fidelity hook: returns the real export PNG as a data URL so the rendered
  // output can be compared against the on-screen board (no drift).
  if (isDev) {
    (window as unknown as Record<string, unknown>).__ox = {
      pngDataUrl: (scale = 1) => {
        const boards = document.querySelectorAll<HTMLElement>('.ox-board');
        const board = boards[activeBoard] ?? boards[0];
        const at = layout.boards[activeBoard]?.artboard ?? layout.boards[0]?.artboard;
        return board && at ? boardToPngDataUrl(board, at.w, at.h, scale) : Promise.resolve(null);
      },
    };
  }

  return (
    <div className="ox-app">
      {showUi && (
        <header className="ox-toolbar">
          {config.build.showDesignBrowser && (
            <a className="ox-icon-btn" href="/" title="Library" onClick={(e) => { e.preventDefault(); navigate('/'); }}>←</a>
          )}
          <span className="ox-brand">OpenCanva<span className="ox-dot">.</span></span>
          <span className="ox-doc-title">{title}</span>

          <span className="ox-spacer" />

          <div className="ox-zoom">
            <button type="button" className="ox-icon-btn" title="Zoom out" onClick={() => vp.zoomBy(1 / 1.2)}>−</button>
            <button type="button" className="ox-zoom-label" title="Fit to screen" onClick={vp.fit}>{Math.round(vp.zoom * 100)}%</button>
            <button type="button" className="ox-icon-btn" title="Zoom in" onClick={() => vp.zoomBy(1.2)}>+</button>
          </div>

          {scenes.length > 1 && (
            <select className="ox-board-select" value={activeBoard} onChange={(e) => setActiveBoard(Number(e.target.value))}>
              {scenes.map((s, i) => (
                <option key={s.id ?? i} value={i}>{s.label ?? s.id ?? `Board ${i + 1}`}</option>
              ))}
            </select>
          )}

          {isDev && (
            <button type="button" className={`ox-btn${inspect ? ' ox-btn--active' : ''}`} onClick={() => setInspect((v) => !v)}>
              {inspect ? 'Editing' : 'Edit'}
            </button>
          )}
          {isDev && (
            <button type="button" className={`ox-btn${assets ? ' ox-btn--active' : ''}`} onClick={() => setAssets((v) => !v)}>Assets</button>
          )}

          <div className="ox-menu">
            <button type="button" className="ox-btn ox-btn--primary">Export ▾</button>
            <div className="ox-menu-list">
              {config.build.allowPngDownload && <button type="button" onClick={() => doExport('png')}>PNG</button>}
              {config.build.allowSvgDownload && <button type="button" onClick={() => doExport('svg')}>SVG</button>}
              {config.build.allowPdfDownload && <button type="button" onClick={() => doExport('pdf')}>PDF</button>}
            </div>
          </div>
        </header>
      )}

      <div className="ox-shell">
        {showUi && (
          <LayersPanel
            scenes={scenes}
            title={title}
            designKey={id}
            onFocusBoard={(i) => { setActiveBoard(i); vp.fit(); }}
          />
        )}
        <Stage
          stageRef={stageRef}
          canvasRef={canvasRef}
          scenes={scenes}
          moduleArtboard={mod.artboard}
          design={design}
          viewport={vp}
        />
      </div>

      {assets ? <AssetsPanel designId={id} onClose={() => setAssets(false)} /> : null}
      {isDev && showUi ? (
        <Inspector active={inspect} zoom={vp.zoom} revision={revision} designId={id} onSelectionChange={setSelection} />
      ) : null}
    </div>
  );
}

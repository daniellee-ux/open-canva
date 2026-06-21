import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import config from 'virtual:opencanva/config';
import { designIds } from 'virtual:opencanva/designs';
import { resolveDesign } from '../design';
import type { CanvaSource } from './lib/fiber';
import { useDesignModule } from './lib/use-design-module';
import { useUiTheme } from './lib/ui-theme';
import { useAgentSocketConnected } from './lib/use-agent-socket';
import { navigate } from './lib/navigate';
import { findLayoutIssues } from './lib/overflow';
import { useViewport } from './lib/viewport';
import { boardToPngDataUrl, exportPdf, exportPng, exportSvg } from './lib/export';
import { Stage, layoutBoards } from './components/Stage';
import { Inspector } from './components/Inspector';
import { LayersPanel } from './components/LayersPanel';
import { AssetsPanel } from './components/AssetsPanel';
import { TokensPanel } from './components/TokensPanel';
import { Home, ThemesPage, ThemeDetail, ThemeToggle } from './components/Workspace';
import { ToastHost, toast } from './components/ui/toast';
import { Menu, SelectMenu } from './components/ui/Menu';
import { Icon } from './components/icons';

const isDev = import.meta.env.DEV;

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
  return (
    <>
      {routePage(path)}
      <ToastHost />
    </>
  );
}

function AgentBadge() {
  const connected = useAgentSocketConnected();
  return (
    <span
      className={`ox-agent${connected ? ' is-live' : ' is-offline'}`}
      title={
        connected
          ? 'Live sync is on. Edits you or the agent make to the source files appear on the canvas instantly.'
          : 'Live sync lost, reconnecting. Source edits will not appear on the canvas until the dev server is back.'
      }
    >
      <span className="ox-agent-dot" />
      {connected ? 'Live sync' : 'Sync lost'}
    </span>
  );
}

function routePage(path: string) {
  const match = /^\/d\/([^/]+)/.exec(path);
  if (match) return <DesignPage id={decodeURIComponent(match[1])} />;
  const themeMatch = /^\/themes\/([^/]+)/.exec(path);
  if (themeMatch) return <ThemeDetail id={decodeURIComponent(themeMatch[1])} />;
  if (path === '/themes') return <ThemesPage />;
  if (!config.build.showDesignBrowser && designIds.length) return <DesignPage id={designIds[0]} />;
  return <Home />;
}

function DesignPage({ id }: { id: string }) {
  const { design: mod, error } = useDesignModule(id);
  const { theme: uiTheme, toggle: toggleUiTheme } = useUiTheme();
  const [inspect, setInspect] = useState(false);
  const [assets, setAssets] = useState(false);
  const [tokens, setTokens] = useState(false);
  const [exporting, setExporting] = useState<'png' | 'svg' | 'pdf' | null>(null);
  const [activeBoard, setActiveBoard] = useState(0);
  const [selection, setSelection] = useState<CanvaSource | null>(null);
  // The selected canvas object's live DOM node, so the layers panel can highlight
  // and scroll to its row — and selecting a row selects it (bi-directional).
  const [selectedEl, setSelectedEl] = useState<HTMLElement | null>(null);
  const handleSelectionChange = useCallback((src: CanvaSource | null, el: HTMLElement | null) => {
    setSelection(src);
    setSelectedEl(el);
  }, []);
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
      view: tokens ? 'tokens' : assets ? 'assets' : inspect ? 'inspect' : 'view',
      selection: selection
        ? { rel: selection.rel, line: selection.line, column: selection.column, tag: selection.tag }
        : null,
    });
  }, [id, title, activeBoard, vp.zoom, inspect, assets, tokens, selection, mod, scenes]);

  // A selection belongs to one board; clear the published cursor selection when
  // the board or design changes (the inspector drops its own via the activeBoard prop).
  useEffect(() => {
    setSelection(null);
    setSelectedEl(null);
  }, [activeBoard, id]);

  // Keep the active board index in range when boards are deleted/reordered.
  useEffect(() => {
    if (scenes.length && activeBoard >= scenes.length) setActiveBoard(scenes.length - 1);
  }, [scenes.length, activeBoard]);

  // Dev layout check — warn once per load when an object's rendered content
  // overflows its container (e.g. a caption that wrapped past its card). The
  // inspector never compares rendered size to the declared box, so this would
  // otherwise stay invisible. See lib/overflow.ts.
  useEffect(() => {
    if (!isDev || !mod) return;
    let alive = true;
    document.fonts.ready
      .then(() => new Promise<void>((r) => setTimeout(r, 80)))
      .then(() => {
        if (!alive) return;
        const issues = findLayoutIssues();
        if (issues.length) {
          console.warn(
            `[opencanva] ${issues.length} layout issue(s) in "${id}":`,
            issues.map((o) => `[${o.kind}] ${o.type}${o.label ? ` "${o.label}"` : ''} — ${o.detail}`),
          );
        }
      });
    return () => {
      alive = false;
    };
  }, [mod, id, revision]);

  if (error) {
    return (
      <div className="ox-msg">
        <a className="ox-back" href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}><Icon name="back" size={14} /> Library</a>
        <h2>Failed to load “{id}”</h2>
        <pre className="ox-err">{error}</pre>
      </div>
    );
  }
  if (!mod) return <div className="ox-msg"><span className="ox-loading">Loading {id}…</span></div>;

  const doExport = async (kind: 'png' | 'svg' | 'pdf') => {
    if (exporting) return; // lock out concurrent exports
    // Scope to the live canvas: LayersPanel thumbnails also render real `.ox-board`
    // nodes (before Stage in the DOM), so an unscoped query would export a thumbnail.
    const boards = document.querySelectorAll<HTMLElement>('.ox-canvas .ox-board');
    const board = boards[activeBoard] ?? boards[0];
    const at = layout.boards[activeBoard]?.artboard ?? layout.boards[0]?.artboard;
    if (!board || !at) {
      toast.err('Nothing to export — no board is rendered.');
      return;
    }
    const slug = (title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || id);
    const fname = `${slug}${scenes.length > 1 ? `-${activeBoard + 1}` : ''}`;
    setExporting(kind);
    try {
      if (kind === 'png') await exportPng(board, at.w, at.h, fname);
      else if (kind === 'svg') await exportSvg(board, at.w, at.h, fname);
      else await exportPdf(board, at.w, at.h, fname);
      toast.ok(`Exported ${fname}.${kind}`);
    } catch (err) {
      toast.err(`Export failed: ${String((err as Error)?.message ?? err)}`);
    } finally {
      setExporting(null);
    }
  };

  // Dev fidelity hook: returns the real export PNG as a data URL so the rendered
  // output can be compared against the on-screen board (no drift).
  if (isDev) {
    (window as unknown as Record<string, unknown>).__ox = {
      pngDataUrl: (scale = 1) => {
        const boards = document.querySelectorAll<HTMLElement>('.ox-canvas .ox-board');
        const board = boards[activeBoard] ?? boards[0];
        const at = layout.boards[activeBoard]?.artboard ?? layout.boards[0]?.artboard;
        return board && at ? boardToPngDataUrl(board, at.w, at.h, scale) : Promise.resolve(null);
      },
      // Layout lint: overflow, invisible/low-contrast text, occlusion, overlap, off-canvas.
      lint: () => findLayoutIssues(),
    };
  }

  return (
    <div className={`ox-app${inspect ? ' is-inspecting' : ''}`}>
      {showUi && (
        <header className="ox-toolbar">
          {config.build.showDesignBrowser && (
            <a className="ox-icon-btn" href="/" title="Library" onClick={(e) => { e.preventDefault(); navigate('/'); }}><Icon name="back" /></a>
          )}
          <span className="ox-brand">OpenCanva<span className="ox-dot">.</span></span>
          <span className="ox-doc-title">{title}</span>
          {isDev && <AgentBadge />}

          <span className="ox-spacer" />

          <ThemeToggle theme={uiTheme} onToggle={toggleUiTheme} />

          <div className="ox-zoom">
            <button type="button" className="ox-icon-btn" title="Zoom out" onClick={() => vp.zoomBy(1 / 1.2)}><Icon name="minus" /></button>
            <button type="button" className="ox-zoom-label" title="Fit to screen" onClick={vp.fit}>{Math.round(vp.zoom * 100)}%</button>
            <button type="button" className="ox-icon-btn" title="Zoom in" onClick={() => vp.zoomBy(1.2)}><Icon name="plus" /></button>
          </div>

          {scenes.length > 1 && (
            <SelectMenu
              label="Active board"
              value={activeBoard}
              options={scenes.map((s, i) => ({ value: i, label: s.label ?? s.id ?? `Board ${i + 1}` }))}
              onChange={setActiveBoard}
            />
          )}

          {isDev && (
            <button type="button" className={`ox-btn${inspect ? ' ox-btn--active' : ''}`} aria-pressed={inspect} onClick={() => setInspect((v) => !v)}>
              {inspect ? 'Editing' : 'Edit'}
            </button>
          )}
          {isDev && (
            <button type="button" className={`ox-btn${assets ? ' ox-btn--active' : ''}`} aria-pressed={assets} onClick={() => { setAssets((v) => !v); setTokens(false); }}>Assets</button>
          )}
          {isDev && (
            <button type="button" className={`ox-btn${tokens ? ' ox-btn--active' : ''}`} aria-pressed={tokens} onClick={() => { setTokens((v) => !v); setAssets(false); }}>Tokens</button>
          )}

          <Menu
            label="Export"
            align="end"
            triggerClassName="ox-btn ox-btn--primary"
            button={exporting ? `Exporting ${exporting.toUpperCase()}…` : <>Export <Icon name="caret" size={14} /></>}
            items={[
              ...(config.build.allowPngDownload ? [{ label: 'PNG', disabled: !!exporting, onSelect: () => doExport('png') }] : []),
              ...(config.build.allowSvgDownload ? [{ label: 'SVG', disabled: !!exporting, onSelect: () => doExport('svg') }] : []),
              ...(config.build.allowPdfDownload ? [{ label: 'PDF', disabled: !!exporting, onSelect: () => doExport('pdf') }] : []),
            ]}
          />
        </header>
      )}

      <div className="ox-shell">
        {showUi && (
          <LayersPanel
            scenes={scenes}
            designKey={id}
            activeBoard={activeBoard}
            onFocusBoard={(i) => { setActiveBoard(i); vp.fit(); }}
            design={design}
            moduleArtboard={mod.artboard}
            selectedEl={selectedEl}
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
      {tokens ? <TokensPanel designId={id} design={design} onClose={() => setTokens(false)} /> : null}
      {isDev && showUi ? (
        <Inspector active={inspect} zoom={vp.zoom} revision={revision} designId={id} activeBoard={activeBoard} onSelectionChange={handleSelectionChange} panBy={vp.panBy} />
      ) : null}
    </div>
  );
}

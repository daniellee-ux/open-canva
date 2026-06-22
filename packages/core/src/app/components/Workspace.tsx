import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { designIds } from 'virtual:opencanva/designs';
import { designPresets, designToCssVars, resolveDesign, type DesignSystem } from '../../design';
import { resolveArtboard } from '../../sdk';
import { useDesignModule } from '../lib/use-design-module';
import { useUiTheme, type UiTheme } from '../lib/ui-theme';
import { navigate } from '../lib/navigate';
import { deleteDesign, duplicateDesign, renameDesign } from '../lib/design-crud';
import { assignDesign, createFolder, deleteFolder, type FoldersManifest, useFolders } from '../lib/folders';
import { ThumbBoard } from './ThumbBoard';
import { Dialog } from './ui/Dialog';
import { Menu, SelectMenu } from './ui/Menu';
import { toast } from './ui/toast';
import { Icon, type IconName } from './icons';

/** First concrete family in a CSS font stack, for display in the theme detail. */
function fontName(stack: string): string {
  return stack.split(',')[0].replace(/['"]/g, '').trim();
}

type WsRoute = 'designs' | 'themes';

const SORT_KEYS = ['created-desc', 'created-asc', 'title-asc', 'title-desc'] as const;
type SortKey = (typeof SORT_KEYS)[number];
const SORT_LABELS: Record<SortKey, string> = {
  'created-desc': 'Newest',
  'created-asc': 'Oldest',
  'title-asc': 'Name A–Z',
  'title-desc': 'Name Z–A',
};
const SORT_STORAGE_KEY = 'opencanva:home-sort';
const TITLE_COLLATOR = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });

type DesignMeta = { title: string; createdAt?: string };

export function ThemeToggle({ theme, onToggle }: { theme: UiTheme; onToggle: () => void }) {
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <button
      type="button"
      className="ox-icon-btn ox-theme-toggle"
      title={`Switch to ${next} mode`}
      aria-label={`Switch to ${next} mode`}
      onClick={onToggle}
    >
      <Icon
        name="contrast"
        size={15}
        style={{
          transform: theme === 'dark' ? 'rotate(180deg)' : 'none',
          transition: 'transform var(--ui-t) var(--ui-ease)',
        }}
      />
    </button>
  );
}

function go(to: string) {
  return (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(to);
  };
}

function NavItem({
  icon,
  label,
  count,
  active,
  href,
}: {
  icon: IconName;
  label: string;
  count: number;
  active: boolean;
  href: string;
}) {
  return (
    <a
      className={`ox-ws-nav-item${active ? ' is-active' : ''}`}
      href={href}
      onClick={go(href)}
      aria-current={active ? 'page' : undefined}
    >
      <Icon name={icon} size={16} />
      <span className="ox-ws-nav-label">{label}</span>
      <span className="ox-ws-nav-count">{count}</span>
    </a>
  );
}

function useSearchParam(key: string): string | null {
  const [v, setV] = useState(() => new URLSearchParams(window.location.search).get(key));
  useEffect(() => {
    const on = () => setV(new URLSearchParams(window.location.search).get(key));
    window.addEventListener('popstate', on);
    return () => window.removeEventListener('popstate', on);
  }, [key]);
  return v;
}

function Sidebar({ selected }: { selected: WsRoute }) {
  const { theme, toggle } = useUiTheme();
  const { manifest } = useFolders();
  const activeFolder = useSearchParam('f');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const onDesigns = selected === 'designs';
  // Count over the live designIds (mirrors the grid filter at line ~465) so a
  // stale assignment for a deleted design doesn't inflate the badge.
  const countFor = (id: string) => designIds.filter((d) => manifest.assignments[d] === id).length;

  const submitCreate = async () => {
    const name = newName.trim();
    setCreating(false);
    setNewName('');
    if (!name) return;
    try {
      const r = await createFolder(name);
      toast.ok(`Folder “${name}” created`);
      navigate(`/?f=${r.id}`);
    } catch (e) {
      toast.err(String((e as Error).message ?? e));
    }
  };

  return (
    <aside className="ox-ws-side">
      <div className="ox-ws-side-top">
        <a className="ox-brand" href="/" onClick={go('/')}>
          OpenCanva<span className="ox-dot">.</span>
        </a>
        <ThemeToggle theme={theme} onToggle={toggle} />
      </div>
      <nav className="ox-ws-nav">
        <NavItem icon="grid" label="Designs" count={designIds.length} active={onDesigns && !activeFolder} href="/" />
        <NavItem
          icon="palette"
          label="Themes"
          count={Object.keys(designPresets).length}
          active={selected === 'themes'}
          href="/themes"
        />
      </nav>

      <div className="ox-ws-folders">
        <div className="ox-ws-folders-head">
          <span>Folders</span>
          <button type="button" className="ox-ws-folders-add" aria-label="New folder" onClick={() => setCreating(true)}>
            <Icon name="plus" size={14} />
          </button>
        </div>
        {manifest.folders.map((f) => (
          <div key={f.id} className={`ox-ws-folder${onDesigns && activeFolder === f.id ? ' is-active' : ''}`}>
            <a className="ox-ws-folder-link" href={`/?f=${encodeURIComponent(f.id)}`} onClick={go(`/?f=${encodeURIComponent(f.id)}`)}>
              <Icon name="folder" size={15} />
              <span className="ox-ws-folder-name">{f.icon ? `${f.icon} ` : ''}{f.name}</span>
              <span className="ox-ws-nav-count">{countFor(f.id)}</span>
            </a>
            <button
              type="button"
              className="ox-ws-folder-del"
              title="Delete folder"
              aria-label={`Delete folder ${f.name}`}
              onClick={async () => {
                try {
                  await deleteFolder(f.id);
                  if (activeFolder === f.id) navigate('/');
                  toast.ok('Folder deleted');
                } catch (e) {
                  toast.err(String((e as Error).message ?? e));
                }
              }}
            >
              <Icon name="trash" size={15} />
            </button>
          </div>
        ))}
        {creating ? (
          <input
            className="ox-ws-folder-input"
            // biome-ignore lint/a11y/noAutofocus: inline create field
            autoFocus
            value={newName}
            placeholder="Folder name…"
            onChange={(e) => setNewName(e.target.value)}
            onBlur={submitCreate}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitCreate();
              else if (e.key === 'Escape') {
                setCreating(false);
                setNewName('');
              }
            }}
          />
        ) : null}
        {manifest.folders.length === 0 && !creating ? <div className="ox-ws-folders-empty">No folders yet</div> : null}
      </div>

      <div className="ox-ws-side-foot">
        <span className="ox-ws-badge">agent-native graphic design</span>
      </div>
    </aside>
  );
}

function WorkspaceShell({ selected, children }: { selected: WsRoute; children: ReactNode }) {
  return (
    <div className="ox-ws">
      <Sidebar selected={selected} />
      <main className="ox-ws-main">
        <div className="ox-ws-main-inner">{children}</div>
      </main>
    </div>
  );
}

function DesignCard({
  id,
  onMeta,
  folders,
}: {
  id: string;
  onMeta: (id: string, meta: DesignMeta) => void;
  folders?: FoldersManifest;
}) {
  const { design: mod, error } = useDesignModule(id);
  const first = mod?.default?.[0];
  const title = mod?.meta?.title ?? id;
  const theme = mod?.meta?.theme;
  const artboard = first ? resolveArtboard(first, mod?.artboard) : null;
  const design = useMemo(
    () => resolveDesign({ design: mod?.design, theme: mod?.meta?.theme }),
    [mod],
  );
  const [dialog, setDialog] = useState<'rename' | 'delete' | 'move' | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [busy, setBusy] = useState(false);
  const currentFolder = folders?.assignments[id] ?? null;

  useEffect(() => {
    if (mod) onMeta(id, { title, createdAt: mod.meta?.createdAt });
  }, [mod, id, title, onMeta]);

  const href = `/d/${encodeURIComponent(id)}`;
  return (
    <>
      <a className="ox-ws-card" href={href} onClick={go(href)}>
        <div className="ox-ws-card-thumb">
          {first && artboard ? (
            <ThumbBoard scene={first} artboard={artboard} design={design} className="ox-ws-thumb" />
          ) : error ? (
            <div className="ox-ws-card-state ox-ws-card-state--err" title={error}>
              <Icon name="warn" size={18} />
            </div>
          ) : (
            <div className="ox-ws-card-state ox-ws-card-skeleton" />
          )}
          {import.meta.env.DEV ? (
            <div className="ox-ws-card-menu">
              <Menu
                label="Design actions"
                button={<span className="ox-ws-card-menu-btn"><Icon name="caret" size={15} /></span>}
                items={[
                  { label: 'Rename', icon: 'text', onSelect: () => { setRenameValue(title); setDialog('rename'); } },
                  {
                    label: 'Duplicate',
                    icon: 'group',
                    onSelect: async () => {
                      try {
                        const r = await duplicateDesign(id);
                        toast.ok(`Duplicated → ${r.id}`);
                      } catch (e) {
                        toast.err(`Duplicate failed: ${String((e as Error).message ?? e)}`);
                      }
                    },
                  },
                  ...(folders && folders.folders.length
                    ? [{ label: 'Move to folder', icon: 'folder' as const, onSelect: () => setDialog('move') }]
                    : []),
                  { separator: true },
                  { label: 'Delete', icon: 'close', danger: true, onSelect: () => setDialog('delete') },
                ]}
              />
            </div>
          ) : null}
        </div>
        <div className="ox-ws-card-meta">
          <span className="ox-ws-card-title">{title}</span>
          {theme ? (
            <span className="ox-ws-card-chip">
              <Icon name="palette" size={11} />
              {theme}
            </span>
          ) : null}
        </div>
      </a>

      <Dialog
        open={dialog === 'rename'}
        onClose={() => setDialog(null)}
        eyebrow="Rename design"
        title={id}
        footer={
          <>
            <button type="button" className="ox-btn" onClick={() => setDialog(null)}>Cancel</button>
            <button
              type="button"
              className="ox-btn ox-btn--primary"
              disabled={busy || !renameValue.trim()}
              onClick={async () => {
                setBusy(true);
                try {
                  await renameDesign(id, renameValue.trim());
                  toast.ok('Renamed');
                  setDialog(null);
                } catch (e) {
                  toast.err(`Rename failed: ${String((e as Error).message ?? e)}`);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Save
            </button>
          </>
        }
      >
        <input
          className="ox-dialog-input"
          value={renameValue}
          maxLength={120}
          onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          }}
        />
        <p className="ox-dialog-note">Renames <code>export const meta.title</code> (the folder id stays <code>{id}</code>).</p>
      </Dialog>

      <Dialog
        open={dialog === 'delete'}
        onClose={() => setDialog(null)}
        eyebrow="Delete design"
        title={`Delete “${title}”?`}
        description={`This permanently removes designs/${id}/ from disk. This can't be undone.`}
        footer={
          <>
            <button type="button" className="ox-btn" onClick={() => setDialog(null)}>Cancel</button>
            <button
              type="button"
              className="ox-btn ox-btn--danger"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await deleteDesign(id);
                  toast.ok(`Deleted ${id}`);
                  setDialog(null);
                } catch (e) {
                  toast.err(`Delete failed: ${String((e as Error).message ?? e)}`);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Delete
            </button>
          </>
        }
      />

      <Dialog
        open={dialog === 'move'}
        onClose={() => setDialog(null)}
        eyebrow="Move to folder"
        title={title}
        autoFocus={false}
      >
        <div className="ox-move-list">
          {[{ id: null as string | null, name: 'None (unassigned)' }, ...(folders?.folders ?? [])].map((f) => (
            <button
              key={f.id ?? '__none'}
              type="button"
              className={`ox-move-item${currentFolder === f.id ? ' is-current' : ''}`}
              onClick={async () => {
                setDialog(null);
                if (currentFolder === f.id) return;
                try {
                  await assignDesign(id, f.id);
                  toast.ok(f.id ? `Moved to “${f.name}”` : 'Removed from folder');
                } catch (e) {
                  toast.err(String((e as Error).message ?? e));
                }
              }}
            >
              <Icon name={f.id ? 'folder' : 'close'} size={15} />
              <span>{f.name}</span>
              {currentFolder === f.id ? <Icon name="check" size={15} /> : null}
            </button>
          ))}
        </div>
      </Dialog>
    </>
  );
}

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="ox-ws-search">
      <Icon name="search" size={14} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search designs…"
        aria-label="Search designs"
      />
      {value ? (
        <button type="button" className="ox-ws-search-clear" aria-label="Clear search" onClick={() => onChange('')}>
          <Icon name="close" size={13} />
        </button>
      ) : null}
    </div>
  );
}

function useSortPref(): [SortKey, (next: SortKey) => void] {
  const [sortKey, setSortKey] = useState<SortKey>(() => {
    try {
      const raw = localStorage.getItem(SORT_STORAGE_KEY);
      if (raw && (SORT_KEYS as readonly string[]).includes(raw)) return raw as SortKey;
    } catch {
      /* storage unavailable */
    }
    return 'created-desc';
  });
  const update = useCallback((next: SortKey) => {
    setSortKey(next);
    try {
      localStorage.setItem(SORT_STORAGE_KEY, next);
    } catch {
      /* storage unavailable */
    }
  }, []);
  return [sortKey, update];
}

export function Home() {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useSortPref();
  const [meta, setMeta] = useState<Record<string, DesignMeta>>({});
  const { manifest } = useFolders();
  const activeFolder = useSearchParam('f');
  const folder = activeFolder ? manifest.folders.find((f) => f.id === activeFolder) : null;

  const onMeta = useCallback((id: string, m: DesignMeta) => {
    setMeta((prev) => {
      const cur = prev[id];
      if (cur && cur.title === m.title && cur.createdAt === m.createdAt) return prev;
      return { ...prev, [id]: m };
    });
  }, []);

  // Scope to the selected folder (if any), then search within that scope.
  const scoped = useMemo(
    () => (activeFolder ? designIds.filter((id) => manifest.assignments[id] === activeFolder) : designIds),
    [activeFolder, manifest],
  );
  const trimmed = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!trimmed) return scoped;
    return scoped.filter(
      (id) =>
        id.toLowerCase().includes(trimmed) ||
        (meta[id]?.title.toLowerCase().includes(trimmed) ?? false),
    );
  }, [trimmed, meta, scoped]);

  const sorted = useMemo(() => {
    const titleOf = (id: string) => meta[id]?.title ?? id;
    const timeOf = (id: string) => {
      const t = meta[id]?.createdAt;
      const ms = t ? Date.parse(t) : NaN;
      return Number.isNaN(ms) ? 0 : ms;
    };
    const list = filtered.slice();
    switch (sortKey) {
      case 'title-asc':
        list.sort((a, b) => TITLE_COLLATOR.compare(titleOf(a), titleOf(b)));
        break;
      case 'title-desc':
        list.sort((a, b) => TITLE_COLLATOR.compare(titleOf(b), titleOf(a)));
        break;
      case 'created-asc':
        list.sort((a, b) => timeOf(a) - timeOf(b));
        break;
      default:
        list.sort((a, b) => timeOf(b) - timeOf(a));
    }
    return list;
  }, [filtered, sortKey, meta]);

  const total = scoped.length;
  const isSearching = trimmed.length > 0;

  return (
    <WorkspaceShell selected="designs">
      <header className="ox-ws-head">
        <div className="ox-ws-head-title">
          <Icon name={folder ? 'folder' : 'grid'} size={20} />
          <h1>{folder ? folder.name : 'Designs'}</h1>
          <span className="ox-ws-folio">
            {(isSearching ? filtered.length : total).toString().padStart(2, '0')}
            {isSearching ? <span className="ox-ws-folio-of">/{total.toString().padStart(2, '0')}</span> : null}
          </span>
        </div>
        {total > 0 ? (
          <div className="ox-ws-head-controls">
            <SelectMenu
              label="Sort designs"
              align="end"
              value={sortKey}
              options={SORT_KEYS.map((k) => ({ value: k, label: SORT_LABELS[k] }))}
              onChange={setSortKey}
            />
            <SearchInput value={query} onChange={setQuery} />
          </div>
        ) : null}
      </header>

      {total === 0 ? (
        folder ? (
          <div className="ox-ws-blank">
            <div className="ox-ws-blank-icon"><Icon name="folder" size={20} /></div>
            <p className="ox-ws-blank-title">“{folder.name}” is empty</p>
            <p className="ox-ws-blank-sub">Use a design's ⋯ menu → <strong>Move to folder</strong> to add it here.</p>
          </div>
        ) : (
          <EmptyState />
        )
      ) : sorted.length === 0 ? (
        <NoResults query={query} onClear={() => setQuery('')} />
      ) : (
        <ul className="ox-ws-grid">
          {sorted.map((id) => (
            <li key={id}>
              <DesignCard id={id} onMeta={onMeta} folders={manifest} />
            </li>
          ))}
        </ul>
      )}
    </WorkspaceShell>
  );
}

function EmptyState() {
  return (
    <div className="ox-ws-blank">
      <div className="ox-ws-blank-icon">
        <Icon name="image" size={22} />
      </div>
      <p className="ox-ws-blank-title">No designs yet</p>
      <p className="ox-ws-blank-sub">
        Create <code>designs/&lt;id&gt;/index.tsx</code> and it appears here — or ask your agent to run{' '}
        <code>/create-design</code>.
      </p>
    </div>
  );
}

function NoResults({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="ox-ws-blank">
      <div className="ox-ws-blank-icon">
        <Icon name="search" size={20} />
      </div>
      <p className="ox-ws-blank-title">No matches</p>
      <p className="ox-ws-blank-sub">
        Nothing matches “<span className="ox-ws-blank-q">{query}</span>”.
      </p>
      <button type="button" className="ox-btn" onClick={onClear}>
        Clear search
      </button>
    </div>
  );
}

export function ThemesPage() {
  const names = Object.keys(designPresets);
  return (
    <WorkspaceShell selected="themes">
      <header className="ox-ws-head">
        <div className="ox-ws-head-title">
          <Icon name="palette" size={20} />
          <h1>Themes</h1>
          <span className="ox-ws-folio">{names.length.toString().padStart(2, '0')}</span>
        </div>
      </header>
      <div className="ox-themes-grid">
        {names.map((name) => {
          const d = designPresets[name];
          const href = `/themes/${encodeURIComponent(name)}`;
          return (
            <a key={name} className="ox-theme-card" href={href} onClick={go(href)}>
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
            </a>
          );
        })}
      </div>
    </WorkspaceShell>
  );
}

export function ThemeDetail({ id }: { id: string }) {
  const d = designPresets[id];
  if (!d) {
    return (
      <WorkspaceShell selected="themes">
        <header className="ox-ws-head">
          <div className="ox-ws-head-title">
            <a className="ox-ws-back" href="/themes" onClick={go('/themes')} aria-label="Back to themes">
              <Icon name="back" size={16} />
            </a>
            <h1>Theme not found</h1>
          </div>
        </header>
        <div className="ox-ws-blank">
          <div className="ox-ws-blank-icon"><Icon name="palette" size={20} /></div>
          <p className="ox-ws-blank-title">No theme named “{id}”</p>
          <p className="ox-ws-blank-sub">Pick one from the gallery.</p>
        </div>
      </WorkspaceShell>
    );
  }
  const swatches: [string, keyof DesignSystem['palette']][] = [
    ['Background', 'bg'],
    ['Foreground', 'fg'],
    ['Muted', 'muted'],
    ['Accent', 'accent'],
    ['Accent 2', 'accent2'],
    ['Surface', 'surface'],
  ];
  const copy = () => {
    void navigator.clipboard?.writeText(`theme: '${id}'`);
    toast.ok(`Copied theme: '${id}'`);
  };
  return (
    <WorkspaceShell selected="themes">
      <header className="ox-ws-head">
        <div className="ox-ws-head-title">
          <a className="ox-ws-back" href="/themes" onClick={go('/themes')} aria-label="Back to themes">
            <Icon name="back" size={16} />
          </a>
          <Icon name="palette" size={20} />
          <h1>{id}</h1>
        </div>
        <div className="ox-ws-head-controls">
          <button type="button" className="ox-btn" onClick={copy}>
            Copy <code>theme: '{id}'</code>
          </button>
        </div>
      </header>

      <div className="ox-theme-detail">
        <div className="ox-theme-preview" style={{ ...designToCssVars(d), background: 'var(--ox-bg)' }}>
          <div className="ox-theme-preview-eyebrow" style={{ color: 'var(--ox-accent)', fontFamily: 'var(--ox-font-body)' }}>
            THEME PREVIEW
          </div>
          <div className="ox-theme-preview-aa" style={{ color: 'var(--ox-fg)', fontFamily: 'var(--ox-font-display)' }}>
            Design that ships itself.
          </div>
          <p className="ox-theme-preview-body" style={{ color: 'var(--ox-muted)', fontFamily: 'var(--ox-font-body)' }}>
            The quick brown fox jumps over the lazy dog — 0123456789.
          </p>
          <div className="ox-theme-preview-chips">
            <span style={{ background: 'var(--ox-accent)' }} />
            <span style={{ background: 'var(--ox-accent2)' }} />
            <span style={{ background: 'var(--ox-surface)', border: '1px solid color-mix(in srgb, var(--ox-fg) 22%, transparent)' }} />
          </div>
        </div>

        <div className="ox-theme-tokens">
          <div className="ox-theme-tokens-group">
            <div className="ox-theme-tokens-label">Palette</div>
            {swatches.map(([label, key]) => (
              <div className="ox-token-row" key={key}>
                <span className="ox-token-chip" style={{ background: d.palette[key] }} />
                <span className="ox-token-name">{label}</span>
                <code className="ox-token-val">{d.palette[key]}</code>
              </div>
            ))}
          </div>
          <div className="ox-theme-tokens-group">
            <div className="ox-theme-tokens-label">Type &amp; shape</div>
            <div className="ox-token-row">
              <span className="ox-token-name">Display</span>
              <code className="ox-token-val">{fontName(d.fonts.display)}</code>
            </div>
            <div className="ox-token-row">
              <span className="ox-token-name">Body</span>
              <code className="ox-token-val">{fontName(d.fonts.body)}</code>
            </div>
            <div className="ox-token-row">
              <span className="ox-token-name">Radius</span>
              <code className="ox-token-val">{d.radius}px</code>
            </div>
          </div>
        </div>
      </div>
    </WorkspaceShell>
  );
}

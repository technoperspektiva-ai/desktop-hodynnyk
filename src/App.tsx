import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowIcon,
  BellIcon,
  CheckIcon,
  ChevronIcon,
  CloseIcon,
  GridIcon,
  HomeIcon,
  LockIcon,
  MoreIcon,
  PinIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  UploadIcon,
} from "./components/Icons";
import { defaultApps, defaultSettings } from "./data/defaultApps";
import {
  deleteApp,
  getAdminToken,
  loadApps,
  loadSettings,
  reorderApps,
  saveApp,
  saveSettings,
  setAdminToken,
  uploadAsset,
} from "./lib/api";
import type { DesktopApp, DesktopSettings, Page } from "./types";

const emptyApp = (index: number): DesktopApp => ({
  id: `app-${crypto.randomUUID()}`,
  name: "",
  description: "",
  url: "",
  category: "Personal",
  icon: "✦",
  iconType: "emoji",
  accent: "#8f9dff",
  coverUrl: "",
  displayMode: "new-tab",
  isPinned: false,
  isVisible: true,
  sortOrder: index,
  widgetEndpoint: "",
  actions: [],
});

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

function AppIcon({ app, size = "normal" }: { app: DesktopApp; size?: "small" | "normal" | "large" }) {
  const style = { "--accent": app.accent } as React.CSSProperties;
  return (
    <span className={`app-icon app-icon--${size}`} style={style}>
      {app.iconType === "url" && app.icon ? <img src={app.icon} alt="" /> : <span>{app.icon || initials(app.name)}</span>}
    </span>
  );
}

function AppCard({
  app,
  onEdit,
  onLaunch,
}: {
  app: DesktopApp;
  onEdit: (app: DesktopApp) => void;
  onLaunch: (app: DesktopApp) => void;
}) {
  const style = { "--accent": app.accent } as React.CSSProperties;
  return (
    <article className="app-card" style={style}>
      {app.coverUrl && <span className="app-card__cover" style={{ backgroundImage: `url("${app.coverUrl.replace(/"/g, "%22")}")` }} />}
      <button className="app-card__main" onClick={() => onLaunch(app)} aria-label={`Open ${app.name}`}>
        <div className="app-card__top">
          <AppIcon app={app} size="large" />
          <span className="app-card__arrow"><ArrowIcon size={18} /></span>
        </div>
        <div className="app-card__copy">
          <div className="eyebrow">{app.category}</div>
          <h3>{app.name}</h3>
          <p>{app.description || "Open application"}</p>
        </div>
      </button>
      <button className="icon-button app-card__menu" onClick={() => onEdit(app)} aria-label={`Edit ${app.name}`}>
        <MoreIcon size={19} />
      </button>
      <span className="app-card__glow" />
    </article>
  );
}

function MiniApp({ app, onLaunch }: { app: DesktopApp; onLaunch: (app: DesktopApp) => void }) {
  return (
    <button className="mini-app" onClick={() => onLaunch(app)}>
      <AppIcon app={app} size="small" />
      <span>
        <strong>{app.name}</strong>
        <small>{app.category}</small>
      </span>
      <ChevronIcon size={16} />
    </button>
  );
}

function EditorModal({
  app,
  existing,
  onClose,
  onSaved,
  onDeleted,
}: {
  app: DesktopApp;
  existing: boolean;
  onClose: () => void;
  onSaved: (app: DesktopApp) => Promise<void>;
  onDeleted: (id: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState(app);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const patch = <K extends keyof DesktopApp>(key: K, value: DesktopApp[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!draft.name.trim() || !/^https?:\/\//i.test(draft.url.trim())) {
      setError("Add a name and a valid http(s) URL.");
      return;
    }
    setBusy(true);
    try {
      await onSaved({ ...draft, name: draft.name.trim(), url: draft.url.trim() });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save app");
    } finally {
      setBusy(false);
    }
  }

  async function upload(file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const url = await uploadAsset(file);
      patch("icon", url);
      patch("iconType", "url");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal-sheet" onSubmit={submit}>
        <div className="sheet-handle" />
        <header className="modal-header">
          <div>
            <span className="eyebrow">{existing ? "Customize app" : "New connection"}</span>
            <h2>{existing ? draft.name : "Add application"}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose}><CloseIcon /></button>
        </header>

        <div className="editor-preview" style={{ "--accent": draft.accent } as React.CSSProperties}>
          <AppIcon app={draft} size="large" />
          <div>
            <strong>{draft.name || "New app"}</strong>
            <span>{draft.category}</span>
          </div>
        </div>

        <div className="form-grid">
          <label>
            <span>Name</span>
            <input value={draft.name} onChange={(e) => patch("name", e.target.value)} placeholder="Photo Vault" />
          </label>
          <label>
            <span>Application URL</span>
            <input value={draft.url} onChange={(e) => patch("url", e.target.value)} placeholder="https://..." inputMode="url" />
          </label>
          <label className="form-grid__wide">
            <span>Description</span>
            <textarea value={draft.description} onChange={(e) => patch("description", e.target.value)} placeholder="What lives here?" rows={2} />
          </label>
          <label>
            <span>Category</span>
            <input value={draft.category} onChange={(e) => patch("category", e.target.value)} placeholder="Personal" />
          </label>
          <label>
            <span>Accent</span>
            <span className="color-control">
              <input type="color" value={draft.accent} onChange={(e) => patch("accent", e.target.value)} />
              <input value={draft.accent} onChange={(e) => patch("accent", e.target.value)} />
            </span>
          </label>
          <label>
            <span>Icon</span>
            <span className="inline-control">
              <input
                value={draft.iconType === "emoji" ? draft.icon : ""}
                disabled={draft.iconType === "url"}
                onChange={(e) => {
                  patch("icon", e.target.value);
                  patch("iconType", "emoji");
                }}
                placeholder="✦"
              />
              <button type="button" className="small-button" onClick={() => fileRef.current?.click()}>
                <UploadIcon size={16} /> Upload
              </button>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden onChange={(e) => upload(e.target.files?.[0])} />
            </span>
          </label>
          <label>
            <span>Open mode</span>
            <select value={draft.displayMode} onChange={(e) => patch("displayMode", e.target.value as DesktopApp["displayMode"])}>
              <option value="new-tab">New tab / app</option>
              <option value="same-tab">Same tab</option>
            </select>
          </label>
          <label className="form-grid__wide">
            <span>Card background image <em>optional</em></span>
            <input value={draft.coverUrl} onChange={(e) => patch("coverUrl", e.target.value)} placeholder="https://.../cover.webp" />
          </label>
          <label className="form-grid__wide">
            <span>Desktop widget endpoint <em>optional</em></span>
            <input value={draft.widgetEndpoint} onChange={(e) => patch("widgetEndpoint", e.target.value)} placeholder="https://app.example.com/api/desktop" />
          </label>
        </div>

        <div className="toggle-row">
          <button type="button" className={`toggle-card ${draft.isPinned ? "is-active" : ""}`} onClick={() => patch("isPinned", !draft.isPinned)}>
            <PinIcon size={18} />
            <span><strong>Pin to Dock</strong><small>Keep it one tap away</small></span>
            <i>{draft.isPinned ? <CheckIcon size={14} /> : null}</i>
          </button>
          <button type="button" className={`toggle-card ${draft.isVisible ? "is-active" : ""}`} onClick={() => patch("isVisible", !draft.isVisible)}>
            <GridIcon size={18} />
            <span><strong>Show app</strong><small>Visible on your desktop</small></span>
            <i>{draft.isVisible ? <CheckIcon size={14} /> : null}</i>
          </button>
        </div>

        {error && <div className="form-error">{error}</div>}

        <footer className="modal-actions">
          {existing && (
            <button
              type="button"
              className="danger-button"
              onClick={async () => {
                if (!confirm(`Remove ${draft.name} from Desktop? The original application will not be deleted.`)) return;
                setBusy(true);
                try {
                  await onDeleted(draft.id);
                  onClose();
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Could not remove app");
                  setBusy(false);
                }
              }}
            >
              Remove
            </button>
          )}
          <span />
          <button type="button" className="ghost-button" onClick={onClose}>Cancel</button>
          <button type="submit" className="primary-button" disabled={busy}>{busy ? "Saving…" : "Save app"}</button>
        </footer>
      </form>
    </div>
  );
}

function App() {
  const [page, setPage] = useState<Page>("home");
  const [apps, setApps] = useState<DesktopApp[]>(defaultApps);
  const [settings, setSettings] = useState<DesktopSettings>(defaultSettings);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<{ app: DesktopApp; existing: boolean } | null>(null);
  const [palette, setPalette] = useState(false);
  const [adminToken, setTokenState] = useState(getAdminToken());
  const [tokenDraft, setTokenDraft] = useState(getAdminToken());
  const [toast, setToast] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([loadApps(), loadSettings()]).then(([loadedApps, loadedSettings]) => {
      setApps(loadedApps.sort((a, b) => a.sortOrder - b.sortOrder));
      setSettings(loadedSettings);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPalette((value) => !value);
      }
      if (event.key === "Escape") {
        setPalette(false);
        setEditor(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (palette) setTimeout(() => searchRef.current?.focus(), 50);
  }, [palette]);

  useEffect(() => {
    document.documentElement.dataset.wallpaper = settings.wallpaper;
    document.documentElement.dataset.glass = settings.glass;
    document.documentElement.dataset.compact = settings.compact ? "true" : "false";
  }, [settings]);

  const visibleApps = useMemo(() => apps.filter((app) => app.isVisible), [apps]);
  const pinned = useMemo(() => visibleApps.filter((app) => app.isPinned).slice(0, 6), [visibleApps]);
  const categories = useMemo(() => Array.from(new Set(visibleApps.map((app) => app.category))), [visibleApps]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return visibleApps;
    return visibleApps.filter((app) => `${app.name} ${app.description} ${app.category}`.toLowerCase().includes(q));
  }, [visibleApps, query]);

  function launch(app: DesktopApp) {
    if (app.displayMode === "same-tab") location.href = app.url;
    else window.open(app.url, "_blank", "noopener,noreferrer");
  }

  async function handleSave(app: DesktopApp) {
    const existing = apps.some((item) => item.id === app.id);
    const saved = await saveApp(app, !existing);
    setApps((current) =>
      existing
        ? current.map((item) => (item.id === saved.id ? saved : item))
        : [...current, saved],
    );
    showToast(existing ? "App updated" : "App added");
  }

  async function handleDelete(id: string) {
    await deleteApp(id);
    setApps((current) => current.filter((item) => item.id !== id));
    showToast("Shortcut removed. Original app is untouched.");
  }

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }

  async function moveApp(id: string, direction: -1 | 1) {
    const index = apps.findIndex((item) => item.id === id);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= apps.length) return;
    const next = [...apps];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    const normalized = next.map((item, idx) => ({ ...item, sortOrder: idx }));
    setApps(normalized);
    await reorderApps(normalized.map((item) => item.id));
  }

  async function patchSettings(next: DesktopSettings) {
    setSettings(next);
    try {
      await saveSettings(next);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Settings saved locally");
    }
  }

  const nav = [
    { id: "home" as const, label: "Home", icon: HomeIcon },
    { id: "apps" as const, label: "Apps", icon: GridIcon },
    { id: "settings" as const, label: "Settings", icon: SettingsIcon },
  ];

  return (
    <div className="desktop-root">
      <div className="ambient ambient--one" />
      <div className="ambient ambient--two" />

      <aside className="sidebar glass">
        <div className="brand-mark"><span>H</span></div>
        <nav className="sidebar-nav">
          {nav.map(({ id, label, icon: Icon }) => (
            <button key={id} className={page === id ? "is-active" : ""} onClick={() => setPage(id)}>
              <Icon />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <button className="sidebar-add" onClick={() => setEditor({ app: emptyApp(apps.length), existing: false })}>
          <PlusIcon />
          <span>Add app</span>
        </button>
        <div className="sidebar-foot">
          <span className="online-dot" />
          <div><strong>Desktop</strong><small>{apps.length} connected apps</small></div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="mobile-brand">
            <div className="brand-mark brand-mark--small"><span>H</span></div>
            <div><strong>Hodynnyk</strong><small>Desktop</small></div>
          </div>
          <button className="command-trigger glass" onClick={() => setPalette(true)}>
            <SearchIcon size={18} />
            <span>Search apps, actions…</span>
            <kbd>⌘ K</kbd>
          </button>
          <div className="topbar-actions">
            <button className="icon-button glass"><BellIcon /></button>
            <button className="avatar-button">ME</button>
          </div>
        </header>

        {page === "home" && (
          <div className={`page page-home ${ready ? "is-ready" : ""}`}>
            <section className="hero">
              <div>
                <span className="eyebrow">YOUR SPACE</span>
                <h1>{settings.title}<span className="hero-dot">.</span></h1>
                <p>{settings.subtitle}</p>
              </div>
              <button className="hero-add" onClick={() => setEditor({ app: emptyApp(apps.length), existing: false })}>
                <PlusIcon size={18} /> Connect app
              </button>
            </section>

            <section className="mobile-quick glass">
              <div className="mobile-quick__header">
                <span>Quick launch</span>
                <button onClick={() => setPage("apps")}>All apps <ArrowIcon size={14} /></button>
              </div>
              <div className="mobile-quick__apps">
                {pinned.slice(0, 5).map((app) => (
                  <button key={app.id} onClick={() => launch(app)}>
                    <AppIcon app={app} />
                    <span>{app.name}</span>
                  </button>
                ))}
                <button onClick={() => setEditor({ app: emptyApp(apps.length), existing: false })}>
                  <span className="app-icon app-icon--normal app-icon--add"><PlusIcon /></span>
                  <span>Add</span>
                </button>
              </div>
            </section>

            <section className="dashboard-grid">
              <div className="dashboard-main">
                <div className="section-heading">
                  <div><span className="eyebrow">PINNED</span><h2>Your apps</h2></div>
                  <button onClick={() => setPage("apps")}>View all <ArrowIcon size={15} /></button>
                </div>
                <div className="app-grid">
                  {(pinned.length ? pinned : visibleApps).slice(0, 4).map((app) => (
                    <AppCard key={app.id} app={app} onEdit={(item) => setEditor({ app: item, existing: true })} onLaunch={launch} />
                  ))}
                </div>
              </div>

              <aside className="right-rail">
                <div className="insight-card glass">
                  <div className="insight-card__top"><span>TODAY</span><span className="status-pill">Flow</span></div>
                  <strong>{visibleApps.length}</strong>
                  <p>apps connected to your personal workspace</p>
                  <div className="metric-line"><i style={{ width: `${Math.min(100, visibleApps.length * 14)}%` }} /></div>
                </div>

                <div className="rail-card glass">
                  <div className="rail-title"><span>Recent space</span><button onClick={() => setPage("apps")}>Manage</button></div>
                  {visibleApps.slice(0, 3).map((app) => <MiniApp key={app.id} app={app} onLaunch={launch} />)}
                </div>

                <div className="quote-card">
                  <span>✦</span>
                  <p>Same drive.<br /><strong>More possibilities.</strong></p>
                  <small>Make the tools disappear. Keep the momentum.</small>
                </div>
              </aside>
            </section>

            {categories.length > 0 && (
              <section className="category-strip">
                {categories.map((category) => {
                  const items = visibleApps.filter((app) => app.category === category);
                  return (
                    <button key={category} onClick={() => { setQuery(category); setPage("apps"); }}>
                      <span>{category}</span>
                      <strong>{items.length.toString().padStart(2, "0")}</strong>
                    </button>
                  );
                })}
              </section>
            )}
          </div>
        )}

        {page === "apps" && (
          <div className="page page-apps is-ready">
            <section className="page-title-row">
              <div><span className="eyebrow">APP LIBRARY</span><h1>Everything, one tap away.</h1><p>Add any current or future project without moving its code.</p></div>
              <button className="primary-button desktop-only" onClick={() => setEditor({ app: emptyApp(apps.length), existing: false })}><PlusIcon size={17} /> Add application</button>
            </section>

            <div className="library-toolbar glass">
              <SearchIcon size={18} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your apps" />
              {query && <button className="icon-button" onClick={() => setQuery("")}><CloseIcon size={16} /></button>}
            </div>

            <div className="library-list">
              {filtered.map((app, index) => (
                <div className="library-row glass" key={app.id}>
                  <button className="library-row__launch" onClick={() => launch(app)}>
                    <AppIcon app={app} />
                    <span><strong>{app.name}</strong><small>{app.category} · {new URL(app.url).hostname}</small></span>
                  </button>
                  <span className="library-row__description">{app.description}</span>
                  <div className="library-row__controls">
                    <button className="order-button" disabled={index === 0} onClick={() => moveApp(app.id, -1)} aria-label="Move up">↑</button>
                    <button className="order-button" disabled={index === filtered.length - 1} onClick={() => moveApp(app.id, 1)} aria-label="Move down">↓</button>
                    {app.isPinned && <span className="pin-badge"><PinIcon size={14} /></span>}
                    <button className="icon-button" onClick={() => setEditor({ app, existing: true })}><MoreIcon /></button>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && <div className="empty-state"><SearchIcon size={30} /><strong>Nothing found</strong><span>Try another name or category.</span></div>}
            </div>
          </div>
        )}

        {page === "settings" && (
          <div className="page page-settings is-ready">
            <section className="page-title-row">
              <div><span className="eyebrow">PERSONALIZE</span><h1>Make it feel yours.</h1><p>Small changes here affect every screen.</p></div>
            </section>

            <div className="settings-grid">
              <section className="settings-card glass">
                <div className="settings-card__title"><span>Appearance</span><small>Wallpaper & density</small></div>
                <div className="wallpaper-picker">
                  {(["aurora", "sunset", "midnight", "paper"] as const).map((wallpaper) => (
                    <button
                      key={wallpaper}
                      className={`wallpaper-swatch wallpaper-swatch--${wallpaper} ${settings.wallpaper === wallpaper ? "is-active" : ""}`}
                      onClick={() => patchSettings({ ...settings, wallpaper })}
                    >
                      {settings.wallpaper === wallpaper && <CheckIcon size={16} />}
                      <span>{wallpaper}</span>
                    </button>
                  ))}
                </div>
                <button className={`setting-toggle ${settings.compact ? "is-active" : ""}`} onClick={() => patchSettings({ ...settings, compact: !settings.compact })}>
                  <span><strong>Compact cards</strong><small>Fit more apps on larger screens</small></span><i />
                </button>
                <button className={`setting-toggle ${settings.glass === "clear" ? "is-active" : ""}`} onClick={() => patchSettings({ ...settings, glass: settings.glass === "soft" ? "clear" : "soft" })}>
                  <span><strong>Clear glass</strong><small>Increase transparency and contrast</small></span><i />
                </button>
              </section>

              <section className="settings-card glass">
                <div className="settings-card__title"><span>Home message</span><small>Your daily landing screen</small></div>
                <label className="settings-field"><span>Heading</span><input value={settings.title} onChange={(e) => patchSettings({ ...settings, title: e.target.value })} /></label>
                <label className="settings-field"><span>Subheading</span><textarea rows={3} value={settings.subtitle} onChange={(e) => patchSettings({ ...settings, subtitle: e.target.value })} /></label>
              </section>

              <section className="settings-card glass settings-card--security">
                <div className="settings-card__title"><span>Admin access</span><small>Protect app editing on a public Worker</small></div>
                <div className="security-note"><LockIcon /><p>Set the same value as your Cloudflare <code>ADMIN_TOKEN</code> secret. It stays in this browser session only.</p></div>
                <label className="settings-field">
                  <span>Admin token</span>
                  <div className="token-control">
                    <input type="password" value={tokenDraft} onChange={(e) => setTokenDraft(e.target.value)} placeholder="••••••••••••" />
                    <button className="small-button" onClick={() => { setAdminToken(tokenDraft); setTokenState(tokenDraft); showToast(tokenDraft ? "Admin session unlocked" : "Admin token cleared"); }}>
                      {adminToken ? "Update" : "Unlock"}
                    </button>
                  </div>
                </label>
                {adminToken && <button className="ghost-button" onClick={() => { setTokenDraft(""); setAdminToken(""); setTokenState(""); showToast("Admin session locked"); }}>Lock this session</button>}
              </section>

              <section className="settings-card glass">
                <div className="settings-card__title"><span>About this Desktop</span><small>Independent apps, one interface</small></div>
                <div className="about-stack">
                  <span><strong>Frontend</strong><small>React + Vite + TypeScript</small></span>
                  <span><strong>Platform</strong><small>Cloudflare Workers</small></span>
                  <span><strong>Registry</strong><small>D1</small></span>
                  <span><strong>Assets</strong><small>R2</small></span>
                  <span><strong>PWA</strong><small>Installable + offline shell</small></span>
                </div>
              </section>
            </div>
          </div>
        )}
      </main>

      <nav className="mobile-dock glass">
        {nav.slice(0, 2).map(({ id, label, icon: Icon }) => (
          <button key={id} className={page === id ? "is-active" : ""} onClick={() => setPage(id)}><Icon /><span>{label}</span></button>
        ))}
        <button className="mobile-dock__add" onClick={() => setEditor({ app: emptyApp(apps.length), existing: false })}><PlusIcon size={23} /></button>
        <button className={page === "settings" ? "is-active" : ""} onClick={() => setPage("settings")}><SettingsIcon /><span>Settings</span></button>
        <button onClick={() => setPalette(true)}><SearchIcon /><span>Search</span></button>
      </nav>

      <div className="desktop-app-dock glass">
        {pinned.map((app) => (
          <button key={app.id} onClick={() => launch(app)} title={app.name}><AppIcon app={app} size="small" /></button>
        ))}
        <span />
        <button onClick={() => setEditor({ app: emptyApp(apps.length), existing: false })}><span className="dock-add"><PlusIcon size={17} /></span></button>
      </div>

      {palette && (
        <div className="palette-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setPalette(false)}>
          <div className="palette glass">
            <div className="palette-search"><SearchIcon /><input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search apps, categories…" /><kbd>ESC</kbd></div>
            <div className="palette-results">
              <span className="eyebrow">APPLICATIONS</span>
              {filtered.slice(0, 7).map((app) => (
                <button key={app.id} onClick={() => { launch(app); setPalette(false); }}>
                  <AppIcon app={app} size="small" /><span><strong>{app.name}</strong><small>{app.category}</small></span><span>Open ↗</span>
                </button>
              ))}
              <button className="palette-add" onClick={() => { setPalette(false); setEditor({ app: emptyApp(apps.length), existing: false }); }}>
                <span className="app-icon app-icon--small app-icon--add"><PlusIcon size={17} /></span><span><strong>Add new application</strong><small>Connect another Worker or website</small></span><span>New</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {editor && (
        <EditorModal
          app={editor.app}
          existing={editor.existing}
          onClose={() => setEditor(null)}
          onSaved={handleSave}
          onDeleted={handleDelete}
        />
      )}

      {toast && <div className="toast glass"><CheckIcon size={17} />{toast}</div>}
    </div>
  );
}

export default App;

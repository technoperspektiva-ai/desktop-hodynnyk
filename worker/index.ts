interface Env {
  DB: D1Database;
  ADMIN_TOKEN?: string;
}

type AppRow = {
  id: string;
  name: string;
  description: string;
  url: string;
  category: string;
  icon: string;
  icon_type: "emoji" | "url";
  accent: string;
  cover_url: string;
  display_mode: "in-app" | "new-tab" | "same-tab";
  is_pinned: number;
  is_visible: number;
  sort_order: number;
  widget_endpoint: string;
  actions_json: string;
  created_at: string;
  updated_at: string;
};

const seedApps = [
  {
    id: "love-letter",
    name: "Love Letter",
    description: "Create something personal and unforgettable.",
    url: "https://love-letter.black-sci-official.workers.dev/",
    category: "Personal",
    icon: "♥",
    accent: "#f184a7",
    sort: 0,
  },
  {
    id: "hodynnyk-calendar",
    name: "Hodynnyk",
    description: "Work calendar, QA rhythm and your schedule.",
    url: "https://hodynnyk-calendar.black-sci-official.workers.dev/",
    category: "Work",
    icon: "◫",
    accent: "#74a9ff",
    sort: 1,
  },
  {
    id: "wwg-qa",
    name: "WWG QA",
    description: "QA tools, checks and utilities in one place.",
    url: "https://for-my-love-girl.black-sci-official.workers.dev/",
    category: "Work",
    icon: "⚡",
    accent: "#6fe3d6",
    sort: 2,
  },
  {
    id: "myhabbit",
    name: "myHabbit",
    description: "Habits, streaks and progress without the boring bits.",
    url: "https://myhabbit-game.foryourkidschannelhappy.workers.dev/?screen=dashboard",
    category: "Personal",
    icon: "✦",
    accent: "#ac8dff",
    sort: 3,
  },
  {
    id: "soft-wellness",
    name: "Soft Wellness",
    description: "Water, nutrition and daily wellbeing.",
    url: "https://soft-wellness.foryourkidschannelhappy.workers.dev/",
    category: "Health",
    icon: "✿",
    accent: "#8bd7a7",
    sort: 4,
  },
] as const;

let schemaReady: Promise<void> | undefined;

function ensureSchema(env: Env) {
  if (!schemaReady) {
    schemaReady = (async () => {
      await env.DB.exec(`
        CREATE TABLE IF NOT EXISTS apps (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          url TEXT NOT NULL,
          category TEXT NOT NULL DEFAULT 'Personal',
          icon TEXT NOT NULL DEFAULT '✦',
          icon_type TEXT NOT NULL DEFAULT 'emoji',
          accent TEXT NOT NULL DEFAULT '#8f9dff',
          cover_url TEXT NOT NULL DEFAULT '',
          display_mode TEXT NOT NULL DEFAULT 'in-app',
          is_pinned INTEGER NOT NULL DEFAULT 0,
          is_visible INTEGER NOT NULL DEFAULT 1,
          sort_order INTEGER NOT NULL DEFAULT 0,
          widget_endpoint TEXT NOT NULL DEFAULT '',
          actions_json TEXT NOT NULL DEFAULT '[]',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);

      const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM apps").first<{ count: number }>();
      if (!count?.count) {
        const now = new Date().toISOString();
        const statements = seedApps.map((app) =>
          env.DB.prepare(`
            INSERT INTO apps
            (id,name,description,url,category,icon,icon_type,accent,cover_url,display_mode,is_pinned,is_visible,sort_order,widget_endpoint,actions_json,created_at,updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
          `).bind(
            app.id, app.name, app.description, app.url, app.category, app.icon, "emoji", app.accent, "",
            "in-app", 1, 1, app.sort, "", "[]", now, now
          )
        );
        await env.DB.batch(statements);
      }

      const defaults = {
        title: "Good afternoon",
        subtitle: "Everything you build, one calm place.",
        wallpaper: "aurora",
        glass: "soft",
        compact: false,
      };
      await env.DB.prepare("INSERT OR IGNORE INTO settings (key,value) VALUES ('desktop',?)")
        .bind(JSON.stringify(defaults)).run();

      // One-time upgrade: the original seeded apps opened with window.open(), which
      // leaves an installed PWA on mobile. Move only the original shortcuts to the
      // in-app shell; user-created apps keep their chosen mode.
      const shellMigration = await env.DB.prepare("SELECT value FROM settings WHERE key='migration:in-app-shell-v1'")
        .first<{ value: string }>();
      if (!shellMigration) {
        const now = new Date().toISOString();
        const ids = seedApps.map((app) => app.id);
        await env.DB.batch([
          env.DB.prepare(`UPDATE apps SET display_mode='in-app', updated_at=?
            WHERE display_mode='new-tab' AND id IN (?,?,?,?,?)`)
            .bind(now, ...ids),
          env.DB.prepare("INSERT INTO settings (key,value) VALUES ('migration:in-app-shell-v1','1')"),
        ]);
      }
    })().catch((error) => {
      schemaReady = undefined;
      throw error;
    });
  }
  return schemaReady;
}

function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  return new Response(JSON.stringify(data), { ...init, headers });
}

function mapApp(row: AppRow) {
  let actions = [];
  try { actions = JSON.parse(row.actions_json || "[]"); } catch {}
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    url: row.url,
    category: row.category,
    icon: row.icon,
    iconType: row.icon_type,
    accent: row.accent,
    coverUrl: row.cover_url,
    displayMode: row.display_mode,
    isPinned: Boolean(row.is_pinned),
    isVisible: Boolean(row.is_visible),
    sortOrder: row.sort_order,
    widgetEndpoint: row.widget_endpoint,
    actions,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isAuthorized(request: Request, env: Env) {
  if (!env.ADMIN_TOKEN) return true;
  const header = request.headers.get("authorization") || "";
  return header === `Bearer ${env.ADMIN_TOKEN}`;
}

function guard(request: Request, env: Env) {
  return isAuthorized(request, env) ? null : json({ error: "Unauthorized — unlock admin access in Settings." }, { status: 401 });
}

function safeString(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function normalizeApp(body: Record<string, unknown>, fallbackId?: string) {
  const url = safeString(body.url, 2048);
  if (!/^https?:\/\//i.test(url)) throw new Error("Application URL must start with http:// or https://");
  const accent = /^#[0-9a-f]{6}$/i.test(String(body.accent || "")) ? String(body.accent) : "#8f9dff";
  return {
    id: safeString(body.id, 120) || fallbackId || crypto.randomUUID(),
    name: safeString(body.name, 80) || "Untitled",
    description: safeString(body.description, 300),
    url,
    category: safeString(body.category, 50) || "Personal",
    icon: safeString(body.icon, 500_000) || "✦",
    iconType: body.iconType === "url" ? "url" : "emoji",
    accent,
    coverUrl: safeString(body.coverUrl, 2048),
    displayMode: body.displayMode === "new-tab" ? "new-tab" : body.displayMode === "same-tab" ? "same-tab" : "in-app",
    isPinned: Boolean(body.isPinned),
    isVisible: body.isVisible !== false,
    sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
    widgetEndpoint: safeString(body.widgetEndpoint, 2048),
    actions: Array.isArray(body.actions) ? body.actions.slice(0, 12) : [],
  };
}

async function readJson(request: Request) {
  try {
    return await request.json<Record<string, unknown>>();
  } catch {
    throw new Error("Invalid JSON");
  }
}

async function handleApi(request: Request, env: Env) {
  await ensureSchema(env);
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === "/api/health") {
    return json({ ok: true, service: "desktop-hodynnyk", now: new Date().toISOString() });
  }

  if (path === "/api/apps" && request.method === "GET") {
    const result = await env.DB.prepare("SELECT * FROM apps ORDER BY sort_order ASC, created_at ASC").all<AppRow>();
    return json({ apps: (result.results || []).map(mapApp) });
  }

  if (path === "/api/apps" && request.method === "POST") {
    const denied = guard(request, env); if (denied) return denied;
    try {
      const app = normalizeApp(await readJson(request));
      const now = new Date().toISOString();
      await env.DB.prepare(`
        INSERT INTO apps
        (id,name,description,url,category,icon,icon_type,accent,cover_url,display_mode,is_pinned,is_visible,sort_order,widget_endpoint,actions_json,created_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `).bind(
        app.id, app.name, app.description, app.url, app.category, app.icon, app.iconType, app.accent,
        app.coverUrl, app.displayMode, app.isPinned ? 1 : 0, app.isVisible ? 1 : 0, app.sortOrder,
        app.widgetEndpoint, JSON.stringify(app.actions), now, now
      ).run();
      return json({ app: { ...app, createdAt: now, updatedAt: now } }, { status: 201 });
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "Invalid app" }, { status: 400 });
    }
  }

  const appMatch = path.match(/^\/api\/apps\/([^/]+)$/);
  if (appMatch && request.method === "PUT") {
    const denied = guard(request, env); if (denied) return denied;
    try {
      const id = decodeURIComponent(appMatch[1]);
      const body = await readJson(request);
      const app = normalizeApp({ ...body, id }, id);
      const now = new Date().toISOString();
      await env.DB.prepare(`
        UPDATE apps SET name=?,description=?,url=?,category=?,icon=?,icon_type=?,accent=?,cover_url=?,display_mode=?,
          is_pinned=?,is_visible=?,sort_order=?,widget_endpoint=?,actions_json=?,updated_at=? WHERE id=?
      `).bind(
        app.name, app.description, app.url, app.category, app.icon, app.iconType, app.accent, app.coverUrl,
        app.displayMode, app.isPinned ? 1 : 0, app.isVisible ? 1 : 0, app.sortOrder, app.widgetEndpoint,
        JSON.stringify(app.actions), now, id
      ).run();
      return json({ app: { ...app, updatedAt: now } });
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "Invalid app" }, { status: 400 });
    }
  }

  if (appMatch && request.method === "DELETE") {
    const denied = guard(request, env); if (denied) return denied;
    const id = decodeURIComponent(appMatch[1]);
    await env.DB.prepare("DELETE FROM apps WHERE id=?").bind(id).run();
    return json({ ok: true });
  }

  if (path === "/api/apps/reorder" && request.method === "POST") {
    const denied = guard(request, env); if (denied) return denied;
    const body = await readJson(request);
    const ids = Array.isArray(body.ids) ? body.ids.filter((id): id is string => typeof id === "string").slice(0, 100) : [];
    await env.DB.batch(ids.map((id, index) => env.DB.prepare("UPDATE apps SET sort_order=?, updated_at=? WHERE id=?").bind(index, new Date().toISOString(), id)));
    return json({ ok: true });
  }

  if (path === "/api/settings" && request.method === "GET") {
    const row = await env.DB.prepare("SELECT value FROM settings WHERE key='desktop'").first<{ value: string }>();
    return json({ settings: row?.value ? JSON.parse(row.value) : {} });
  }

  if (path === "/api/settings" && request.method === "PUT") {
    const denied = guard(request, env); if (denied) return denied;
    const body = await readJson(request);
    const settings = {
      title: safeString(body.title, 80) || "Good afternoon",
      subtitle: safeString(body.subtitle, 160) || "Everything you build, one calm place.",
      wallpaper: ["aurora","sunset","midnight","paper"].includes(String(body.wallpaper)) ? body.wallpaper : "aurora",
      glass: body.glass === "clear" ? "clear" : "soft",
      compact: Boolean(body.compact),
    };
    await env.DB.prepare("INSERT INTO settings (key,value) VALUES ('desktop',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value")
      .bind(JSON.stringify(settings)).run();
    return json({ settings });
  }

  if (path === "/api/assets" && request.method === "POST") {
    const denied = guard(request, env); if (denied) return denied;
    const form = await request.formData();
    const value = form.get("file");
    if (!(value instanceof File)) return json({ error: "Missing file" }, { status: 400 });
    if (value.size > 300_000) return json({ error: "Icon image must be under 300 KB" }, { status: 413 });
    const allowed = new Set(["image/png","image/jpeg","image/webp","image/svg+xml"]);
    if (!allowed.has(value.type)) return json({ error: "Unsupported image format" }, { status: 415 });

    const bytes = new Uint8Array(await value.arrayBuffer());
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    const dataUrl = `data:${value.type};base64,${btoa(binary)}`;
    return json({ url: dataUrl }, { status: 201 });
  }

  return json({ error: "Not found" }, { status: 404 });
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: { "allow": "GET,POST,PUT,DELETE,OPTIONS" } });
    }

    try {
      if (url.pathname.startsWith("/api/")) return await handleApi(request, env);
      return new Response(null, { status: 404 });
    } catch (error) {
      console.error(error);
      return json({ error: "Desktop service error" }, { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;

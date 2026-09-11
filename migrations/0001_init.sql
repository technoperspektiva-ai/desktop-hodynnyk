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
  display_mode TEXT NOT NULL DEFAULT 'new-tab',
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

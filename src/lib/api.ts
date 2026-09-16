import type { DesktopApp, DesktopSettings } from "../types";
import { defaultApps, defaultSettings } from "../data/defaultApps";

const APPS_CACHE = "desktop-hodynnyk:apps";
const SETTINGS_CACHE = "desktop-hodynnyk:settings";
const TOKEN_KEY = "desktop-hodynnyk:admin-token";
const LEGACY_BACKUP = "desktop-hodynnyk:apps-before-sync-fix";

export function getAdminToken() { return sessionStorage.getItem(TOKEN_KEY) || ""; }
export function setAdminToken(token: string) {
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
}
function headers(json = true) {
  const result: Record<string, string> = {};
  if (json) result["content-type"] = "application/json";
  if (getAdminToken()) result.authorization = `Bearer ${getAdminToken()}`;
  return result;
}
function readCache<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
  catch { return fallback; }
}
function cache(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Server remains authoritative. */ }
}
function preserveLegacy() {
  // Never overwrite the only surviving copy of resources saved by the old client.
  if (localStorage.getItem(LEGACY_BACKUP) === null) {
    localStorage.setItem(LEGACY_BACKUP, localStorage.getItem(APPS_CACHE) || "[]");
  }
}
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try { response = await fetch(path, { ...init, cache: "no-store" }); }
  catch { throw new Error("Немає зв’язку із сервером. Зміни не підтверджені — спробуйте ще раз онлайн."); }
  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(data.error || `Помилка сервера: ${response.status}`);
  }
  try { return await response.json() as T; }
  catch { throw new Error("Сервер повернув некоректну відповідь. Збереження не підтверджено."); }
}
export async function loadApps(strict = false): Promise<DesktopApp[]> {
  try {
    preserveLegacy();
    const result = await request<{ apps: DesktopApp[] }>("/api/apps");
    if (!Array.isArray(result.apps)) throw new Error("Сервер не повернув список ресурсів.");
    cache(APPS_CACHE, result.apps);
    return result.apps;
  } catch (error) {
    if (strict) throw error;
    return readCache(APPS_CACHE, defaultApps);
  }
}
export async function saveApp(app: DesktopApp, _isNew: boolean): Promise<DesktopApp> {
  // A legacy local-only app appears existing in the UI but is absent from D1.
  const current = await loadApps(true);
  const exists = current.some(item => item.id === app.id);
  const result = await request<{ app: DesktopApp }>(
    exists ? `/api/apps/${encodeURIComponent(app.id)}` : "/api/apps",
    { method: exists ? "PUT" : "POST", headers: headers(), body: JSON.stringify(app) }
  );
  if (!result.app || result.app.id !== app.id) throw new Error("Сервер не підтвердив збереження ресурсу.");
  cache(APPS_CACHE, [...current.filter(item => item.id !== app.id), result.app]);
  return result.app;
}
export async function recoverLocalApps(): Promise<number> {
  preserveLegacy();
  const backup = readCache<DesktopApp[]>(LEGACY_BACKUP, []);
  let current = await loadApps(true);
  let recovered = 0;
  for (const app of backup) {
    if (current.some(item => item.id === app.id || item.url === app.url)) continue;
    const saved = await saveApp(app, true);
    current = [...current, saved];
    recovered++;
  }
  return recovered;
}
export async function deleteApp(id: string) {
  await request(`/api/apps/${encodeURIComponent(id)}`, { method: "DELETE", headers: headers(false) });
  cache(APPS_CACHE, readCache<DesktopApp[]>(APPS_CACHE, []).filter(item => item.id !== id));
}
export async function reorderApps(ids: string[]) {
  await request("/api/apps/reorder", { method: "POST", headers: headers(), body: JSON.stringify({ ids }) });
}
export async function loadSettings(): Promise<DesktopSettings> {
  try {
    const result = await request<{ settings: DesktopSettings }>("/api/settings");
    cache(SETTINGS_CACHE, result.settings);
    return result.settings;
  } catch { return readCache(SETTINGS_CACHE, defaultSettings); }
}
export async function saveSettings(settings: DesktopSettings) {
  await request("/api/settings", { method: "PUT", headers: headers(), body: JSON.stringify(settings) });
  cache(SETTINGS_CACHE, settings);
}

export async function uploadAsset(file: File): Promise<string> {
  const token = getAdminToken();
  const form = new FormData();
  form.append("file", file);
  const response = await fetch("/api/assets", {
    method: "POST",
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
    body: form,
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: "Upload failed" }));
    throw new Error((data as { error?: string }).error || "Upload failed");
  }
  const data = (await response.json()) as { url: string };
  return data.url;
}

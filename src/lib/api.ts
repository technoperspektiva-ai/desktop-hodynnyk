import type { DesktopApp, DesktopSettings } from "../types";
import { defaultApps, defaultSettings } from "../data/defaultApps";

const APPS_CACHE = "desktop-hodynnyk:apps";
const SETTINGS_CACHE = "desktop-hodynnyk:settings";
const TOKEN_KEY = "desktop-hodynnyk:admin-token";

export function getAdminToken() {
  return sessionStorage.getItem(TOKEN_KEY) || "";
}

export function setAdminToken(token: string) {
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
}

function headers(json = true) {
  const token = getAdminToken();
  const result: Record<string, string> = {};
  if (json) result["content-type"] = "application/json";
  if (token) result.authorization = `Bearer ${token}`;
  return result;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error((data as { error?: string }).error || response.statusText);
  }
  return response.json() as Promise<T>;
}

export async function loadApps(): Promise<DesktopApp[]> {
  try {
    const result = await request<{ apps: DesktopApp[] }>("/api/apps");
    localStorage.setItem(APPS_CACHE, JSON.stringify(result.apps));
    return result.apps;
  } catch {
    const cached = localStorage.getItem(APPS_CACHE);
    return cached ? JSON.parse(cached) : defaultApps;
  }
}

export async function saveApp(app: DesktopApp, isNew: boolean): Promise<DesktopApp> {
  const path = isNew ? "/api/apps" : `/api/apps/${encodeURIComponent(app.id)}`;
  const method = isNew ? "POST" : "PUT";
  try {
    const result = await request<{ app: DesktopApp }>(path, {
      method,
      headers: headers(),
      body: JSON.stringify(app),
    });
    return result.app;
  } catch (error) {
    if (error instanceof Error && /unauthorized/i.test(error.message)) throw error;
    const apps = await loadApps();
    const next = isNew
      ? [...apps.filter((item) => item.id !== app.id), app]
      : apps.map((item) => (item.id === app.id ? app : item));
    localStorage.setItem(APPS_CACHE, JSON.stringify(next));
    return app;
  }
}

export async function deleteApp(id: string) {
  try {
    await request(`/api/apps/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: headers(false),
    });
  } catch (error) {
    if (error instanceof Error && /unauthorized/i.test(error.message)) throw error;
    const apps = await loadApps();
    localStorage.setItem(APPS_CACHE, JSON.stringify(apps.filter((item) => item.id !== id)));
  }
}

export async function reorderApps(ids: string[]) {
  try {
    await request("/api/apps/reorder", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ ids }),
    });
  } catch {
    // Local state remains authoritative until the API is reachable again.
  }
}

export async function loadSettings(): Promise<DesktopSettings> {
  try {
    const result = await request<{ settings: DesktopSettings }>("/api/settings");
    localStorage.setItem(SETTINGS_CACHE, JSON.stringify(result.settings));
    return result.settings;
  } catch {
    const cached = localStorage.getItem(SETTINGS_CACHE);
    return cached ? JSON.parse(cached) : defaultSettings;
  }
}

export async function saveSettings(settings: DesktopSettings) {
  localStorage.setItem(SETTINGS_CACHE, JSON.stringify(settings));
  try {
    await request("/api/settings", {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify(settings),
    });
  } catch (error) {
    if (error instanceof Error && /unauthorized/i.test(error.message)) throw error;
  }
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

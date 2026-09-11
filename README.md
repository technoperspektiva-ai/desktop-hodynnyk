# desktop-hodynnyk

A mobile-first personal desktop for independent Cloudflare applications.

The existing apps stay in their own repositories and Workers. This project stores only registry metadata: URL, name, icon, category, accent, visibility, Dock state, display mode and optional future widget endpoint.

## Stack

- React 19 + Vite + TypeScript
- Cloudflare Workers
- D1 — app registry, settings and inline custom icon data
- PWA — installable mobile shell with offline fallback

## Included apps

The first run seeds Love Letter, Hodynnyk Calendar, WWG QA, myHabbit and Soft Wellness.

## Build and deploy

Cloudflare can keep its current deploy command:

```bash
npx wrangler deploy
```

`postinstall` runs `vite build` automatically, so the redirected Wrangler config and `dist/client` are ready before deploy.

The project intentionally does not require R2, KV or any other Cloudflare product besides Workers + D1.

## Custom icons

Uploaded icons up to 300 KB are converted to a `data:` URL and saved with the app record in D1. Remote icon URLs and emoji continue to work too.

## Adding future apps

Open **Apps → Add application**. You can change name, description, URL, category, icon, accent, background URL, Dock pin, visibility and launch mode. Removing an app only removes its Desktop registry entry; it never deletes the original Worker.

## Optional admin protection

The API supports an optional `ADMIN_TOKEN` Worker secret. If it is not configured, editing remains open. This is intentional so the first deployment works without any manual Cloudflare setup.

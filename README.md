# desktop-hodynnyk

A mobile-first personal desktop for independent Cloudflare applications.

The existing apps stay in their own repositories and Workers. This project stores only metadata about them: URL, name, icon, category, accent, visibility, Dock state and future widget endpoint.

## Stack

- React 19 + Vite + TypeScript
- Cloudflare Workers
- D1 — application registry and desktop settings
- R2 — uploaded custom app icons
- PWA — installable mobile shell with offline fallback

## Included apps

The first run automatically seeds:

1. Love Letter
2. Hodynnyk Calendar
3. WWG QA
4. myHabbit
5. Soft Wellness

## Local start

```bash
npm install
npm run dev
```

The latest Wrangler can provision local D1/R2 resources from `wrangler.jsonc`.

## Protect editing before public deploy

The Desktop can be publicly readable while mutation endpoints are protected by an admin token.

Set it as a Cloudflare secret:

```bash
npx wrangler secret put ADMIN_TOKEN
```

Enter the same token in **Settings → Admin access** after deployment. It is stored in `sessionStorage`, so it disappears when the browser session ends.

If `ADMIN_TOKEN` is not configured, writes are allowed. This is convenient for local development but is not recommended for a public deployment.

## Deploy

```bash
npm run deploy
```

Cloudflare's Vite plugin builds both the React app and the Worker. `wrangler.jsonc` uses SPA fallback and routes `/api/*` plus `/user-assets/*` through the Worker.

## Adding future apps

Open the installed Desktop:

**Apps → Add application**

You can change:

- name / description
- URL
- category
- emoji or uploaded icon
- accent color
- visibility
- Dock pin
- same-tab or new-tab launch mode
- optional future `/api/desktop` widget endpoint

Removing an app removes only the registry entry. It never deletes or modifies the original Worker.

## Future desktop widget convention

An app can later expose an optional endpoint such as:

```text
https://example.workers.dev/api/desktop
```

The field already exists in the registry. A future Desktop release can query that endpoint to render live metrics/actions without moving the app into this repository.

## Cloudflare notes

`wrangler.jsonc` intentionally follows Cloudflare's current Vite + Workers SPA pattern. D1 and R2 bindings omit IDs/bucket names so recent Wrangler versions can automatically provision them on deployment. If your Cloudflare account disables automatic provisioning, create the resources manually and let Wrangler write the IDs back into the config.

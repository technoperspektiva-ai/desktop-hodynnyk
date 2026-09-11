# Быстрый старт — desktop-hodynnyk

## 1. Загрузи содержимое этой папки в репозиторий `desktop-hodynnyk`

Не вкладывай папку `desktop-hodynnyk` ещё в одну одноимённую папку — `package.json` должен лежать в корне репозитория.

## 2. Локально, если хочешь проверить

```bash
npm install
npm run dev
```

## 3. Защити редактирование перед публичным деплоем

```bash
npx wrangler secret put ADMIN_TOKEN
```

Введи длинный случайный токен. После деплоя открой Desktop → Settings → Admin access и введи тот же токен.

## 4. Деплой

```bash
npm run deploy
```

Wrangler 4.x умеет автоматически создать D1 и R2 из `wrangler.jsonc`, поэтому вручную переносить остальные проекты или создавать таблицы не нужно.

## 5. Что уже внутри

- Love Letter
- Hodynnyk Calendar
- WWG QA
- myHabbit
- Soft Wellness
- добавление будущих приложений по URL
- кастомные категории, цвета, иконки и фон карточки
- Pin to Dock / hide / reorder / remove shortcut
- мобильный bottom Dock
- Command Search (`Ctrl/Cmd + K`)
- D1 App Registry
- R2 custom icon upload
- PWA install/offline shell

Удаление приложения из Desktop **не удаляет исходный Worker**.


## Cloudflare build note

The repository provisions the named R2 bucket `desktop-hodynnyk-user-assets` during `bun run build`, then Vite builds the Worker/client. No manual R2 setup is required in the Cloudflare dashboard.

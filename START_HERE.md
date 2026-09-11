# Быстрый старт — desktop-hodynnyk

1. Загрузи содержимое архива в корень репозитория `desktop-hodynnyk`.
2. Ничего дополнительно в Cloudflare включать не нужно.
3. Оставь текущий Deploy command: `npx wrangler deploy`.
4. `bun install` сам вызовет `postinstall`, а тот выполнит `vite build`.
5. Wrangler использует уже созданную D1 `desktop-hodynnyk` и деплоит Worker + React assets.

В проекте больше нет R2. Пользовательские иконки до 300 KB сохраняются вместе с записью приложения в D1 как inline data URL.

После первого успешного запуска Desktop автоматически заполнит пять текущих приложений и позволит добавлять новые по URL.


## PWA shell mode
The bundled apps open inside Desktop by default. On mobile, the system Back action closes the current app viewer and returns to Desktop. If a future resource blocks iframe embedding, edit that app and choose **Same PWA window** or **External browser / new window**.

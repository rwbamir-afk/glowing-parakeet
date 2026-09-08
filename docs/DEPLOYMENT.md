# Hokm Arena: run and deploy

This project has three deployable services:

- **Web app**: the Telegram Mini App built from `artifacts/hokm-arena`
- **API**: the Express service built from `artifacts/api-server`
- **Telegram bot**: the grammY service in `services/telegram-bot`

## Local development

Install dependencies once:

```bash
pnpm install
```

Run the API:

```bash
PORT=5000 pnpm --filter @workspace/api-server run dev
```

In a second terminal, run the bot:

```bash
TELEGRAM_BOT_TOKEN="token-from-botfather" \
API_BASE_URL="http://localhost:5000" \
pnpm --filter @workspace/telegram-bot run dev
```

Run the web app through its managed workflow so its routing variables are supplied automatically:

```bash
pnpm --filter @workspace/hokm-arena run dev
```

For a local Mini App URL, use a public HTTPS tunnel and set `WEB_APP_URL` to that URL.

## Create the Telegram bot

1. Open [@BotFather](https://t.me/BotFather) in Telegram.
2. Run `/newbot` and save the token in a password manager.
3. Run `/setcommands` and paste:

```text
start - Open Hokm Arena
play - Open the game
profile - Show your profile
shop - Browse the shop
daily - Claim the daily reward
invite - Invite a friend
stats - Show your Hokm stats
```

4. Add the Mini App URL with `/setmenubutton` after the web app is deployed.
5. Never commit the bot token or put it in frontend code.

## Render Blueprint

The root `render.yaml` creates the web app, API, and bot services. In Render:

1. Create a **Blueprint** from this repository.
2. Let Render create all three services.
3. Set the following environment values on `hokm-arena-bot`:
   - `TELEGRAM_BOT_TOKEN`: the value from BotFather
   - `WEB_APP_URL`: the public URL of `hokm-arena-web`
   - `API_BASE_URL`: the public URL of `hokm-arena-api`
4. Set the following build-time values on `hokm-arena-web`:
   - `VITE_API_BASE_URL`: the public URL of `hokm-arena-api`
   - `VITE_WS_URL`: the API WebSocket URL, ending in `/api/ws`
5. If the API is switched to PostgreSQL in a later phase, set `DATABASE_URL` on `hokm-arena-api`.
6. Trigger a web redeploy after changing the `VITE_*` values, because static Vite values are embedded during the build.
7. Open the bot in Telegram and send `/start`.

The bot uses long polling by default, so it can run on a Render web service while
also exposing `/healthz`. `BOT_MODE=webhook` is available for a later webhook
deployment; it needs an HTTPS webhook route and a configured webhook URL.

## Free-plan expectations

The current API uses in-memory fixtures from the original prototype. Room,
reward, and shop changes reset when the API service restarts. Phase 2 makes the
services deployable; persistent players, economy, matchmaking, and authoritative
realtime play still require the database/realtime phase.

Render service URLs are assigned after creation. Do not hard-code them in source;
put them in the bot's `API_BASE_URL` and `WEB_APP_URL` environment variables.

## Validation

```bash
pnpm run typecheck
pnpm --filter @workspace/telegram-bot run build
pnpm --filter @workspace/hokm-arena run build
```
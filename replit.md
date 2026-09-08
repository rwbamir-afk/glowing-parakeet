# Hokm Arena

A Persian-first Telegram Hokm arena with a web Mini App, API service, and grammY Telegram bot.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm --filter @workspace/telegram-bot run dev` — run the Telegram bot locally
- `pnpm --filter @workspace/hokm-arena run dev` — run the web Mini App
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only, when the schema is added)
- See `docs/DEPLOYMENT.md` for BotFather, local, and Render setup.
- Bot secret: `TELEGRAM_BOT_TOKEN` (Replit Secret or Render environment variable)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- Bot: grammY + Express health endpoint
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/hokm-arena/src/App.tsx` — routed lobby, room browser, table, profile, and rankings experience.
- `artifacts/hokm-arena/src/index.css` — Persian night-game visual system and RTL foundation.
- `artifacts/api-server/src/routes/hokm.ts` — prototype room, profile, lobby, ranking, reward, table, and shop API.
- `services/telegram-bot/src/index.ts` — Telegram commands, Mini App launch button, API calls, and health endpoint.
- `lib/api-spec/openapi.yaml` — source of truth for shared API contracts.
- `render.yaml` — Render Blueprint for the web, API, and bot services.

## Architecture decisions

- The Telegram bot is a separate workspace service so it can be deployed and restarted independently from the API and web app.
- The bot uses long polling by default, which avoids requiring a public webhook route and works with a Render web service.
- The bot calls the API through `API_BASE_URL`; no bot token or deployment URL is embedded in source code.
- The current API intentionally keeps the original in-memory fixtures; persistence and authoritative multiplayer belong to the next phase.

## Product

The current phase includes a Persian RTL lobby, daily reward claim, room browsing and creation, rankings, player progression, a playable classic table, table chat, a rotating shop, a Render deployment blueprint, and Telegram commands for opening the Mini App and reading profile/shop/reward data.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Keep `TELEGRAM_BOT_TOKEN` in secrets or Render environment variables only.
- The bot needs `API_BASE_URL` and `WEB_APP_URL` configured in its deployment environment.
- The current API state is not persistent and resets on restart.
- After changing `lib/api-spec/openapi.yaml`, run `pnpm --filter @workspace/api-spec run codegen`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

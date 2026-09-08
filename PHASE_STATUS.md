# Hokm Arena Phase Status

Updated after the authoritative game-core phase.

## Coded

### Phase 1 — Prototype foundation

- Persian RTL lobby and table UI
- Room browsing and room creation prototype
- Profile, rankings, daily reward, shop, and cosmetics prototype
- Initial API contract and generated client types
- Basic card-play interaction

### Phase 2 — Deployment and Telegram entry point

- Render Blueprint for web, API, and bot services
- grammY Telegram bot
- `/start`, `/play`, `/profile`, `/shop`, `/daily`, `/invite`, and `/stats`
- Bot health endpoint
- Render and BotFather setup documentation
- Static web build supports separate Render API and WebSocket service URLs

### Phase 3A — Authoritative game core

- Deterministic seeded deck generation
- SHA-256 seed commitment stored in table state
- Legal-card validation, including follow-suit enforcement
- Turn validation
- Trump-aware trick winner calculation
- Team trick scoring
- Server-owned table state
- WebSocket table-state broadcast at `/api/ws`
- Web client realtime table subscription and connection indicator

## Not coded yet

- Telegram `initData` validation and account binding
- PostgreSQL persistence for players, rooms, economy, and match history
- Complete four-player multiplayer actions over WebSockets
- AI opponents and partner replacement
- Quick match, ranked ladder, tournaments, spectators, and reconnect grace periods
- Shelem, Nares, three-player, and two-player rule variants
- Coins, Stars, Gems, payments, subscriptions, referrals, and anti-farming
- Full cosmetics collection, crafting, gifting, and limited editions
- XP, achievements, seasons, quests, prestige, and Hall of Fame
- Friends, clubs, voice chat, replays, reporting, and moderation
- Full 3D cards, table skins, lighting, audio, haptics, and cinematic replay
- Admin tools, analytics, rate limiting, DDoS protection, and data export/delete
- Nowruz, Yalda, regional derby, AI commentary, Card Museum, and Story Mode

The 200-feature blueprint remains the product roadmap. This file records the
implemented boundary after each completed phase; it does not claim that the
entire roadmap is finished.
# CURSED Dashboard — Architecture

## Hard rule

**This repository never imports, calls, or runs any code from the CURSED bot.**
The dashboard is a standalone Next.js app. It is deployed separately (Vercel),
versioned separately, and can be redeployed or rolled back without touching
the bot process running on Railway.

```
┌─────────────────┐      HTTPS       ┌──────────────────┐      driver      ┌───────────┐      polls/streams      ┌──────────────┐
│  Dashboard (UI)  │ ───────────────▶ │  Next.js API      │ ───────────────▶ │  MongoDB  │ ◀─────────────────────── │  CURSED Bot  │
│  Vercel          │ ◀─────────────── │  routes (this repo)│ ◀─────────────── │  Atlas    │ ─────────────────────▶ │  Railway     │
└─────────────────┘     JSON          └──────────────────┘     JSON          └───────────┘                         └──────────────┘
```

- The **dashboard** (React Server Components + client components) never talks to MongoDB directly. It only calls its own `/api/*` routes.
- The **API routes** (`src/app/api/**`) are the *only* code in this repo allowed to open a MongoDB connection. They validate input, check permissions, and write documents shaped exactly like what the bot already expects.
- **MongoDB** is the single source of truth and the only thing shared between the two codebases.
- The **bot** (separate repo, separate process, untouched by this project) reads its guild config from MongoDB on its own schedule/cache — the same way it always has. It does not know or care that a dashboard exists.
- The one exception is **live status** (ping, uptime, memory): the bot exposes a small read-only HTTP endpoint on Railway, and the dashboard's `/api/bot-status` route proxies it with a server-side API key. The dashboard still never talks to Discord's gateway or the bot process directly.

## Why this separation matters

- The bot can be redeployed, restarted, or crash without ever affecting the dashboard's uptime.
- The dashboard can be redesigned or rebuilt from scratch without a single line of bot code changing.
- Config writes are validated and permission-checked in one place (the API layer), so the bot can trust whatever it reads from Mongo without re-validating it.

## Data flow for a typical settings change

1. User toggles "Welcome messages" on in the dashboard UI.
2. Client component calls `PUT /api/guilds/[guildId]/welcome`.
3. API route: verifies the session (NextAuth + Discord OAuth2), checks the user has `MANAGE_GUILD` on that guild, validates the payload with Zod, then `updateOne`s the `guildConfigs` collection.
4. Bot picks up the change the next time it reads/caches that guild's config (interval or change-stream, depending on how the bot is built — not this repo's concern).

## Folder structure

```
src/
  app/
    (marketing)/          → public landing page
    (auth)/login/         → Discord OAuth2 sign-in
    (dashboard)/dashboard/ → authenticated guild management UI
      overview/
      welcome/
      goodbye/
      autorole/
      ai-settings/
      moderation/
      logs/
      settings/
      analytics/
      premium/
    api/
      auth/discord/callback/ → OAuth2 token exchange
      servers/                → list guilds the user manages
      bot-status/             → proxies the bot's Railway health endpoint
  components/
    marketing/    → landing page sections
    dashboard/    → sidebar, guild switcher, settings panels
    ui/           → shadcn/ui primitives (button, card, switch, etc.)
    shared/       → cross-cutting (avatars, empty states, loaders)
  lib/            → db client, auth config, discord API helpers, validation schemas
  hooks/          → client-side data hooks (React Query-style)
  types/          → shared TypeScript types (mirrors MongoDB document shapes)
```

## MongoDB collections (contract with the bot)

These are the shapes the API layer writes and the bot is expected to read.
Field names and types must stay in sync with the bot's own config schema —
coordinate changes with whoever maintains that repo before renaming anything.

- `guildConfigs` — one document per guild: welcome/goodbye, autorole, AI settings, moderation, logging channels, prefix/language/timezone/embed color.
- `guildStats` — rolling counters used by the Analytics page (commands used, AI requests, member joins, mod actions).
- `users` — cached Discord profile + which guilds they manage (refreshed on login).
- `premiumEntitlements` — placeholder collection for the future Premium tier.

Exact field-level schemas live in `src/types/` and `src/lib/validation/` once those are built out in the dashboard step.

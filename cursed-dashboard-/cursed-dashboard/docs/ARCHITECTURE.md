# CURSED Dashboard Architecture

## Request flow

```text
Browser
  -> Vercel Next.js route (Auth.js session + Manage Guild verification)
  -> Railway /api/dashboard route (DASHBOARD_API_SECRET)
  -> Discord client cache and MongoDB
```

The dashboard never imports bot code and never receives `BOT_TOKEN` or
`MONGO_URI`. Only Vercel server code can read `DASHBOARD_API_SECRET`. Every
guild API route first verifies the signed-in user's current Discord permission;
the Railway API independently verifies the shared secret and live guild
membership.

## Live Railway endpoints

```text
GET  /api/dashboard/health
POST /api/dashboard/guilds/presence
GET  /api/dashboard/guilds/:guildId/overview
GET  /api/dashboard/guilds/:guildId/welcome
PUT  /api/dashboard/guilds/:guildId/welcome
GET  /api/dashboard/guilds/:guildId/autorole
PUT  /api/dashboard/guilds/:guildId/autorole
```

All endpoints require `Authorization: Bearer <DASHBOARD_API_SECRET>`, validate
guild snowflakes and request bodies, return `Cache-Control: no-store`, and are
rate limited. Browser origins are rejected unless they exactly match the bot's
`DASHBOARD_URL`.

## MongoDB contract

The bot owns the `guildConfigs` collection. Each document has a unique
top-level `guildId`, timestamps, and existing feature fields. The dashboard
does not create another collection or nested draft object.

Welcome updates only:

```text
welcomeChannelId
welcomeMessage
welcomeUseAI
welcomeColor
welcomeThumbnail
welcomeImageUrl
welcomeFooter
```

Autorole updates only:

```text
autoroleId
autoroleRoleName
```

`GuildConfigStore` reads MongoDB first, falls back to `serverConfig.json` only
when MongoDB has no guild document, inserts legacy JSON with `$setOnInsert`, and
refreshes its in-memory cache on `GUILD_CONFIG_REFRESH_MS`.

## Unsupported features

The live bot has no goodbye configuration, per-guild AI settings, persisted
dashboard event log, or historical analytics series. Those pages stay visible
with explicit unavailable states. Their old prototype APIs return `501` after
authentication and cannot write dashboard-only configuration.

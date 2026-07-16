# CURSED Dashboard

Next.js 15 control panel for the CURSED Discord bot. Authenticated dashboard
routes verify the user's Discord `Manage Guild` permission, then call the live
Railway bot API with a server-only shared secret. The browser never receives a
Discord access token, bot token, MongoDB URI, or API secret.

## Live features

- Discord OAuth and manageable-server selection
- Live bot, MongoDB, guild, AI-provider, and tracked-command status
- Welcome configuration using the bot's exact seven flat config fields
- Single-role Autorole configuration with live hierarchy checks
- Honest unavailable states for features the bot does not persist or support

## Local development

```bash
npm install
copy .env.example .env.local
npm run dev
```

Set `BOT_API_URL` to a running bot origin. `DASHBOARD_API_SECRET` must be the
same non-empty random value in the dashboard and bot environments.

## Vercel

Import `JUPJEET1902U/cursed-discord-bot-DASHBOARD` with:

- Framework Preset: `Next.js`
- Root Directory: `cursed-dashboard-/cursed-dashboard`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: leave blank
- Node.js: 20 or newer

Required Production environment variables:

```text
DASHBOARD_URL=https://cursed-discord-bot-dashboard.vercel.app
NEXTAUTH_SECRET=<random secret>
DISCORD_CLIENT_ID=<Discord application ID>
DISCORD_CLIENT_SECRET=<Discord OAuth client secret>
BOT_API_URL=https://<railway-service-domain>
DASHBOARD_API_SECRET=<same value configured on Railway>
```

Do not define `AUTH_URL`, `NEXTAUTH_URL`, `DISCORD_BOT_TOKEN`, `MONGO_URI`, or
`MONGODB_URI` in Vercel. They are not used by this dashboard architecture.

The Discord Developer Portal OAuth redirect URI is:

```text
https://cursed-discord-bot-dashboard.vercel.app/api/auth/callback/discord
```

## Railway

The bot keeps the existing `node index.js` start command and `/health` check.
Add these variables to the same service:

```text
BOT_TOKEN=<Discord bot token>
MONGO_URI=<MongoDB URI including the database name>
DASHBOARD_API_SECRET=<same value configured on Vercel>
DASHBOARD_URL=https://cursed-discord-bot-dashboard.vercel.app
GUILD_CONFIG_REFRESH_MS=5000
GUILD_CONFIG_MIRROR_JSON=true
```

`DASHBOARD_URL` restricts browser-origin requests. Normal Vercel-to-Railway
requests are server-to-server and authenticated with `DASHBOARD_API_SECRET`.

## Validation

```bash
npm run type-check
npm run build
```

See `docs/ARCHITECTURE.md` for the request flow and supported config contract.

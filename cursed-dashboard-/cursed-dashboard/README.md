# CURSED Dashboard

Standalone Next.js 15 dashboard for the CURSED Discord bot. See `docs/ARCHITECTURE.md`
for how this repo stays fully decoupled from the bot (communicates only via
REST API → MongoDB).

## Status

Built incrementally per spec:

- [x] 1. Folder structure
- [x] 2. Architecture (`docs/ARCHITECTURE.md`)
- [x] 3. Landing page (`src/app/(marketing)/page.tsx` + `src/components/marketing/*`)
- [x] 4. Discord OAuth2 authentication (`src/lib/auth/*`, `src/middleware.ts`, `(auth)/login`, `(dashboard)/dashboard`)
- [x] 5. Dashboard shell + guild context (`src/lib/guild.ts`, `(guild)/layout.tsx`, `src/components/dashboard/*`)
- [ ] 6. Feature pages (Welcome, Goodbye, Autorole, AI Settings, Moderation, Logs, Settings, Analytics, Premium)

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Discord + MongoDB credentials
npm run dev
```

## Stack

Next.js 15 (App Router) · React · TypeScript · Tailwind CSS · shadcn/ui ·
Framer Motion · MongoDB · NextAuth (Discord OAuth2) · deployed on Vercel,
talking to the bot's Railway-hosted status endpoint for live stats only.
 

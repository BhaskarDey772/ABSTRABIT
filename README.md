# Discord Slash-Command Bot

## What it does

A web app + Discord bot: an admin signs in with Discord and connects a server they manage, users run `/report` (opens a form) or `/status` in that server, the app verifies + dedups + records + acts on each interaction, replies in Discord, mirrors a notification to a second channel (Slack or another Discord channel), and a login-gated dashboard shows the live log and lets the admin configure command behavior per server.

## Architecture

- **App**: Next.js (App Router, TypeScript) — one deployable covering the admin dashboard UI and `/api/discord/interactions`.
- **DB**: Supabase Postgres via Prisma. Every table is scoped by `Server` (wrapping a Discord guild id), so multiple servers are isolated from day one, not a retrofit.
- **Auth**: Supabase Auth with Discord as the OAuth provider — admin identity is tied to real Discord `MANAGE_GUILD` permission (checked via `/users/@me/guilds`), not just an unrelated login screen.
- **Discord**: Developer Portal application, Ed25519 signature verification (`tweetnacl`) on every request before it's even parsed, dedup on `discordInteractionId`, deferred response + followup edit for the slow path (`/report`).
- **Mirror channel**: Slack Incoming Webhook or a second Discord channel webhook, admin's choice, with retry-with-backoff and failures surfaced in the log rather than swallowed.
- **AI (stretch)**: NVIDIA NIM — `nvidia/llama-3.3-nemotron-super-49b-v1.5` primary, `nvidia/llama-3.1-nemotron-nano-8b-v1` fallback on timeout/error — tags and summarizes `/report` text via a structured tool call. Never blocks the core flow if both fail.
- **Hosting**: Vercel.

See [`docs/design.md`](docs/design.md) for the full design writeup, including deliberate scope cuts.

## Running locally

```bash
npm install
cp .env.example .env        # fill in real values, see below
npm run db:migrate          # applies the Prisma schema to your Supabase DB
npm run discord:register    # registers /report and /status (instant if DISCORD_DEV_GUILD_ID is set)
npm run dev
```

Discord's interactions endpoint must be a public HTTPS URL, so local runs can't receive real Discord traffic without a tunnel (e.g. `ngrok http 3000`) pointed at `/api/discord/interactions`, set as the Interactions Endpoint URL in the Developer Portal.

Other useful scripts: `npm test` (Vitest), `npm run db:studio` (Prisma Studio), `npm run lint`, `npm run build`.

## Environment variables

See `.env.example` for the full list with inline comments. Summary:

| Var | Purpose |
|---|---|
| `DATABASE_URL` / `DIRECT_URL` | Supabase Postgres, pooled (runtime) vs. direct (Prisma migrations) |
| `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_SECRET_KEY` | Server-side DB/auth client (new key system, not legacy anon/service_role) |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Same publishable values, exposed to the browser for the "Sign in with Discord" button |
| `DISCORD_APPLICATION_ID` / `DISCORD_PUBLIC_KEY` / `DISCORD_BOT_TOKEN` | Bot identity, signature verification, posting messages, command registration |
| `DISCORD_DEV_GUILD_ID` | Test server id, for instant guild-scoped command registration during dev |
| `SLACK_WEBHOOK_URL` / `DISCORD_MIRROR_WEBHOOK_URL` | Reference values for testing — the actual mirror target per server is set in the dashboard, stored on the `Server` row |
| `NVIDIA_API_KEY_PRIMARY` / `NVIDIA_API_KEY_FALLBACK` | NIM inference keys (one per model, not interchangeable) |

## Deployment

_TODO once deployed: Vercel project setup, how the Discord Interactions Endpoint URL was registered against the live URL, how env vars were set in the Vercel dashboard, and the Discord OAuth redirect URL registered in the Developer Portal._

## Testing it

_TODO: test server invite link, throwaway admin login, which commands to try, expected mirror-channel behavior._

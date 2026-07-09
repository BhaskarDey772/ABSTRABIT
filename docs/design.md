# Discord Slash-Command Bot - Design

Take-home assignment (see `Discord Slash-Command Bot-20260707065152.md` for the original spec).

## Decisions

- **Commands**: `/report <opens modal>` and `/status`.
- **Multi-tenancy**: every table scoped by our own `Server` row from day one, not hardcoded to one guild.
- **Admin auth**: Supabase Auth with Discord as the OAuth provider (not hand-rolled OAuth, not email/password). `identify guilds` scope; only guilds where the admin has `MANAGE_GUILD` are connectable.
- **Stretch goals in scope**: AI triage, multi-server, config-driven command rules (folded into core), `/report` as a modal (MODAL_SUBMIT interaction type). Buttons/MESSAGE_COMPONENT explicitly out of scope - contained work over spread-thin.
- **AI**: NVIDIA NIM, `llama-3.3-nemotron-super-49b-v1.5` primary / `llama-3.1-nemotron-nano-8b-v1` fallback, tool-calling schema for structured `{tag, summary}`. Chosen over the spec's suggested Gemini/Groq - still free/no-card, but NVIDIA's own tool-calling-tuned flagship on their own platform (documented in `AI_NOTES.md`).

## Stack

Next.js (App Router, TS) on Vercel, single deployable for dashboard + API routes. Prisma + Supabase Postgres (`DATABASE_URL` pooled runtime / `DIRECT_URL` direct for migrations). `tweetnacl` for Ed25519. Tailwind for dashboard UI.

## Data model

```prisma
model AdminUser {
  id              String   @id
  discordUserId   String   @unique
  discordUsername String
  createdAt       DateTime @default(now())
  servers         Server[]
}

model Server {
  id               String   @id @default(uuid())
  discordGuildId   String   @unique
  guildName        String
  replyChannelId   String?
  mirrorType       MirrorType
  mirrorWebhookUrl String
  connectedById    String
  connectedBy      AdminUser @relation(fields: [connectedById], references: [id])
  createdAt        DateTime @default(now())
  commands         CommandConfig[]
  interactions     Interaction[]
}

model CommandConfig {
  id               String  @id @default(uuid())
  serverId         String
  server           Server  @relation(fields: [serverId], references: [id])
  commandName      String
  enabled          Boolean @default(true)
  responseTemplate String  @default("Thanks, logged: {{summary}}")
  aiEnabled        Boolean @default(true)
  flagKeywords     String[] @default([])
  @@unique([serverId, commandName])
}

model Interaction {
  id                    String   @id @default(uuid())
  discordInteractionId  String   @unique
  serverId              String
  server                Server   @relation(fields: [serverId], references: [id])
  commandName           String
  discordUserId         String
  rawPayload            Json
  interactionType       String
  status                InteractionStatus @default(RECEIVED)
  ackType               Int?
  aiTag                 String?
  aiSummary             String?
  aiFailed              Boolean  @default(false)
  mirrorStatus          MirrorStatus @default(PENDING)
  errorLog              Json?
  createdAt             DateTime @default(now())
  respondedAt           DateTime?
  mirroredAt            DateTime?
}

enum MirrorType { SLACK DISCORD }
enum InteractionStatus { RECEIVED PROCESSING RESPONDED FAILED }
enum MirrorStatus { PENDING SENT FAILED }
```

## Interactions endpoint (`POST /api/discord/interactions`)

1. Verify Ed25519 over the raw body (`tweetnacl`, headers `X-Signature-Ed25519`/`X-Signature-Timestamp`) before parsing JSON. Invalid → 401.
2. `type === 1` (PING) → `{ type: 1 }` immediately, no DB.
3. Dedup: insert `Interaction` keyed on `discordInteractionId`; unique-violation means a Discord retry - replay stored `ackType`, no side effects re-run.
4. `/status` (type 2): synchronous DB read, respond type `4` directly.
5. `/report` bare invocation: respond type `9` (open MODAL). Modal submit arrives as its own interaction (type `5`, MODAL_SUBMIT) - goes through steps 1–3 again with a new interaction id. Respond type `5` (DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE) to stop the 3s clock, then via `after()`: run AI, apply `flagKeywords`, update the `Interaction` row, `PATCH` the followup message, fire the mirror webhook.
   - Note: Discord reuses `5` for both an interaction type and a response type - name the constants, never compare against a bare `5`.

## AI fallback

Primary call with ~4s `AbortController` timeout, `tools` schema forcing `{tag, summary}`. Timeout/non-2xx → fallback model, own short timeout. Both fail → `aiFailed=true`, continue with `flagKeywords` rule only. AI never blocks the core flow.

## Mirror + resilience

Mirror send: ~3 retries with backoff; failure → `errorLog` + `mirrorStatus=FAILED`, does not affect the already-sent Discord response or the durably-recorded `Interaction` row. Dashboard surfaces failed rows rather than hiding them (this is where "meaningful observability" comes from).

## Dashboard

- `/login` - Discord OAuth via Supabase.
- `/servers` - list connected servers; connect flow lists guilds where admin has `MANAGE_GUILD` via `/users/@me/guilds`, cross-checked against guilds the bot token can see.
- `/servers/[id]` - **Log** tab (paginated `Interaction` list, failures visible) and **Config** tab (per-command enable/template/AI toggle/keywords, reply-channel dropdown fetched via bot token, mirror webhook field).

Client-side Supabase usage is limited to `SUPABASE_PUBLISHABLE_KEY` + the user's own session. Bot token, webhook URLs, NIM keys, and `SUPABASE_SECRET_KEY` are server-only.

## Testing

Vitest, narrow and targeted rather than a full suite: signature verification (valid/tampered/replayed/missing headers), dedup (side effects don't double-fire on repeat insert), AI fallback (primary fails → fallback called → both fail → `aiFailed` path), `flagKeywords` rule matching in isolation. No e2e - manual real-Discord round-trip is the actual acceptance test before submission.

## Known, documented scope cuts

- `provider_token` from Supabase's Discord provider isn't auto-refreshed; Discord tokens expire ~1 week. Fine for a demo, would need re-auth handling for a real product.
- Server-admin relationship is fixed at connect-time, not re-validated against live Discord permissions on every dashboard load.
- MESSAGE_COMPONENT (buttons) interaction type not implemented - explicit scope cut for contained work over spread-thin, given the 72h window.

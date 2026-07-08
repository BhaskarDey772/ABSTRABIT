# Slash commands

Registered by `npm run discord:register` (see `scripts/register-commands.mjs`) — guild-scoped to `DISCORD_DEV_GUILD_ID` for instant registration during dev, global (no guild id) for production. **Not run yet against your bot** — do that once `DISCORD_APPLICATION_ID`/`DISCORD_BOT_TOKEN`/`DISCORD_DEV_GUILD_ID` are in `.env`.

## `/status`

No arguments. Synchronous — a single DB read, no AI, no deferred response.

- Handler: [`src/lib/discord/commands/status.ts`](../src/lib/discord/commands/status.ts)
- Fetches the 5 most recent `Interaction` rows for the calling server and replies immediately (Discord response type 4) with each one's command name, status, and AI tag if present.
- Reads the `CommandConfig` row's `enabled` flag is **not** currently enforced here — see "Known gaps" below.

## `/report`

Two-step flow, both steps go through the full verify → dedup → server-lookup pipeline as separate interactions:

1. **Bare invocation** (`APPLICATION_COMMAND`) — handler opens a modal (response type 9) with a single paragraph text input (`report_text`). No DB side effects beyond the interaction being logged.
2. **Modal submit** (`MODAL_SUBMIT`, `custom_id: report_modal`) — handler:
   - Responds with a deferred ack (type 5) immediately, stopping Discord's 3s clock.
   - In the background (`after()`, runs post-response): applies the server's `flagKeywords` rule, runs AI triage (NVIDIA NIM, primary model then fallback on failure) if `CommandConfig.aiEnabled`, fills the `responseTemplate` (`{{summary}}` placeholder), edits the deferred reply, optionally posts a duplicate message to the configured `replyChannelId`, updates the `Interaction` row, and sends the mirror webhook.
   - Handler: [`src/lib/discord/commands/report.ts`](../src/lib/discord/commands/report.ts)

Every step's result — including partial failure (AI down, mirror down, Discord edit failed) — lands in the `Interaction` row (`status`, `aiFailed`, `mirrorStatus`, `errorLog`) and is visible on `/servers/[id]/log`, with manual retry buttons for failed mirror sends and failed AI tagging.

## Per-server configuration

Both commands have a `CommandConfig` row per server (created at connect-time), editable on `/servers/[id]/config`:

| Field | Effect |
|---|---|
| `enabled` | Gates whether the command runs at all — checked in `route.ts` right after dedup, before dispatch, replies ephemerally that it's disabled |
| `responseTemplate` | `/report`'s reply text, `{{summary}}` is replaced with the AI summary (or the raw report text if AI is off/failed) |
| `aiEnabled` | Skips the NIM call entirely when off; `flagKeywords` rule still applies |
| `flagKeywords` | Comma-separated; a case-insensitive substring match in the report text sets `aiTag` to `high-priority` |

## Known gaps

- `/status`'s only configurable behavior is `enabled` (now wired) — it doesn't read `responseTemplate`, `aiEnabled`, or `flagKeywords`, which don't apply to a read-only status check anyway.

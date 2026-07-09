# AI_NOTES

## Tools and models used

- Claude Code for essentially the entire build: architecture, the interactions endpoint, dashboard, tests, deployment, and most of the debugging. I drove it conversationally rather than writing a persistent CLAUDE.md/AGENTS.md for this project, so there's no separate context file to include beyond this one.
- v0 (Vercel) for a UI styling pass on the login/servers/config/log pages, on top of components already built with Claude Code. Its commits are authored `v0 <it+v0agent@vercel.com>` in the history, kept as-is rather than reauthored.
- NVIDIA NIM as the in-product AI step (not a coding tool): `meta/llama-3.1-8b-instruct` primary, `nvidia/llama-3.3-nemotron-super-49b-v1.5` fallback. Not the spec's suggested Gemini/Groq (see below).

No project-specific AI instruction file (CLAUDE.md/AGENTS.md/.cursorrules) was used for this repo.

## Key decisions made myself

1. **NVIDIA NIM over Gemini/Groq for the AI stretch goal**, still free/no-card. Which specific NIM model to use as primary changed after live testing found `llama-3.3-nemotron-super-49b-v1.5` with forced tool-calling hung for more than 20 seconds on the free tier, which is why AI tagging was silently failing on every report early on. Switched to a plain "respond with JSON" prompt against the faster `meta/llama-3.1-8b-instruct`, keeping the 49B reasoning model as a slower fallback instead of dropping it.
2. **Supabase over a separate Postgres host + auth provider.** The dashboard needs both a database and admin login, and Supabase gives both from one free signup, with Discord as a built-in OAuth provider instead of hand-rolling that flow. One fewer service to configure and keep free-tier-compliant, which mattered given the "everything must be free" constraint.
3. **Dedup on a database unique constraint, not an app-level check.** `discordInteractionId` is unique in the schema, so a duplicate insert fails at the database level and the failure itself is what signals "this is a retry, don't re-run side effects." An app-level "check if it exists, then insert" has a race window under concurrent retries; a unique constraint doesn't. Later, when the Interactions endpoint started running on Vercel, I also pinned the deployment region to match Supabase's (both in the Sydney region) after finding cross-Pacific DB latency was eating most of Discord's 3-second response budget, a production-environment issue that didn't show up in local dev at all.

## Hardest bug / wrong turn

Midway through a UI pass, I ran `npx shadcn add` to pull in a couple more components. It silently rewrote `tsconfig.json`'s path alias from `./src/*` to `./*`, breaking every `@/` import in the project. I didn't notice right away, because at the same time I was also mid-way through several other real, unrelated fixes (a dark-mode theme bug, a Discord command timeout issue), so when the user reported "nothing is working," I initially chased those other leads instead. The dev server was still technically running, so requests were returning generic 500s rather than an obvious build error, which is what made it easy to misattribute. I only found the actual cause by methodically re-running `tsc --noEmit` after ruling out the more "interesting" hypotheses and seeing the full list of broken imports at once. The fix was a one-line revert, but the lesson was about trust: a CLI tool doing something destructive as a side effect of an unrelated command is exactly the kind of thing that's easy to miss when you're already mid-debugging something else, and I should have diffed `tsconfig.json` right after running that command instead of assuming it only touched `components.json` and the component files it reported.

## What I'd improve with more time

- Multi-admin support. `Server.connectedById` is a single owner right now; reconnecting transfers ownership to whoever most recently verified Manage Server access rather than allowing several admins at once. Found this gap live when testing with a second (throwaway) admin account and had to decide between "transfer on reconnect" and building real multi-admin support under time pressure; I chose the smaller fix.
- A real end-to-end test that sends an actual Ed25519-signed request through the deployed endpoint, rather than only unit-testing the signature verification function in isolation. The unit tests give good coverage of the logic, but the "does the whole HTTP path actually work" check was still manual, by hand, against the live Discord app.
- `provider_token` from Supabase's Discord OAuth isn't refreshed, so the "connect a server" flow's `/users/@me/guilds` call would start failing for an admin whose Discord session is more than about a week old. Documented as a known limitation, not fixed.
- Better in-dashboard visibility into *why* the daily cron retry sweep did or didn't fix something, beyond the per-row error log; right now you'd have to check Vercel's cron logs directly.

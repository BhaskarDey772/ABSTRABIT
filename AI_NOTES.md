# AI_NOTES

> Draft — fill in honestly once the build is done. This is the section graders read most closely; specifics beat generalities.

## Tools and models used

- Claude Code for architecture, implementation, and debugging — fill in rough split of what was AI-driven vs. hand-written.
- v0 (Vercel) for a UI styling pass on the login/servers/config/log pages — restyled components and layout built earlier with Claude Code; commits from it are authored `v0 <it+v0agent@vercel.com>` in the history, kept as-is rather than squashed/reauthored.
- NVIDIA NIM as the in-product AI step (not a coding tool) — `meta/llama-3.1-8b-instruct` primary, `nvidia/llama-3.3-nemotron-super-49b-v1.5` fallback. Not the spec's suggested Gemini/Groq (see below).

## Key decisions made myself

1. **NVIDIA NIM over Gemini/Groq for the AI stretch goal**, still free/no-card. Which specific NIM model to use as primary changed after live testing found `llama-3.3-nemotron-super-49b-v1.5` with forced tool-calling hung >20s on the free tier; switched to a plain "respond with JSON" prompt against the faster `meta/llama-3.1-8b-instruct`, with the 49B reasoning model kept as a slower fallback rather than dropped entirely.
2. _TODO: DB/auth choice (Supabase bundles Postgres + admin auth in one free service) — why that beat a separate DB + separate auth provider._
3. _TODO: one more — e.g. how dedup/idempotency was implemented, or the defer/follow-up strategy for the 3s window._

## Hardest bug / wrong turn

_TODO — be specific: what the AI got wrong, how you noticed, how you fixed it. This is the part that matters most._

## What I'd improve with more time

_TODO._

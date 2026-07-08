# AI_NOTES

> Draft — fill in honestly once the build is done. This is the section graders read most closely; specifics beat generalities.

## Tools and models used

- Claude Code for architecture, implementation, and debugging — fill in rough split of what was AI-driven vs. hand-written.
- NVIDIA NIM (`llama-3.3-nemotron-super-49b-v1.5` primary / `llama-3.1-nemotron-nano-8b-v1` fallback) as the in-product AI step, not a coding tool — note this choice deliberately isn't the spec's suggested Gemini/Groq, and why (see below).

## Key decisions made myself

1. **NVIDIA NIM over Gemini/Groq for the AI stretch goal.** Still free/no-card, but chosen because NIM's OpenAI-compatible `tools` schema gives structured tag/summary output, and `llama-3.3-nemotron-super-49b-v1.5` is NVIDIA's own tool-calling-tuned model on their own platform — lower risk of the free endpoint being deprioritized than a third-party preview model.
2. _TODO: DB/auth choice (Supabase bundles Postgres + admin auth in one free service) — why that beat a separate DB + separate auth provider._
3. _TODO: one more — e.g. how dedup/idempotency was implemented, or the defer/follow-up strategy for the 3s window._

## Hardest bug / wrong turn

_TODO — be specific: what the AI got wrong, how you noticed, how you fixed it. This is the part that matters most._

## What I'd improve with more time

_TODO._

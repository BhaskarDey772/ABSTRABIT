import type { MirrorType } from '@prisma/client'

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function buildBody(mirrorType: MirrorType, text: string) {
  // Slack webhooks expect { text }, Discord webhooks expect { content }.
  return mirrorType === 'SLACK' ? { text } : { content: text }
}

/** Sends the mirror notification with a few retries. Never throws — caller checks the return value. */
export async function sendMirror(
  mirrorType: MirrorType,
  webhookUrl: string,
  text: string,
  attempts = 3
): Promise<{ ok: true } | { ok: false; error: string }> {
  let lastError = ''
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildBody(mirrorType, text)),
      })
      if (res.ok) return { ok: true }
      lastError = `${res.status} ${await res.text()}`
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err)
    }
    if (attempt < attempts) await sleep(attempt * 300)
  }
  return { ok: false, error: lastError }
}

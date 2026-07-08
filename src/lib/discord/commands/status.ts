import { ResponseType } from '@/lib/discord/types'
import type { Interaction } from '@prisma/client'

/** /status — synchronous, no AI. Takes already-fetched rows (see route.ts's combined
 *  query) instead of querying itself, so this stays a single round trip end to end. */
export function handleStatus(recent: Pick<Interaction, 'commandName' | 'status' | 'aiTag'>[]) {
  const lines =
    recent.length === 0
      ? ['No commands logged yet.']
      : recent.map((r) => `• /${r.commandName} — ${r.status}${r.aiTag ? ` [${r.aiTag}]` : ''}`)

  return Response.json({
    type: ResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content: `Last ${recent.length} command(s):\n${lines.join('\n')}` },
  })
}

import { prisma } from '@/lib/prisma'
import { ResponseType } from '@/lib/discord/types'
import type { Server } from '@prisma/client'

/** /status — synchronous, no AI, just a read of recent activity for this server. */
export async function handleStatus(server: Server) {
  const recent = await prisma.interaction.findMany({
    where: { serverId: server.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  const lines =
    recent.length === 0
      ? ['No commands logged yet.']
      : recent.map((r) => `• /${r.commandName} — ${r.status}${r.aiTag ? ` [${r.aiTag}]` : ''}`)

  return Response.json({
    type: ResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content: `Last ${recent.length} command(s):\n${lines.join('\n')}` },
  })
}

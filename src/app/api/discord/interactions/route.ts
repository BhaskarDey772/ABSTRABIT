import { NextResponse, after } from 'next/server'
import { verifyDiscordRequest } from '@/lib/discord/verify'
import { prisma } from '@/lib/prisma'
import { InteractionType, ResponseType, DiscordInteraction, resolveCommandName } from '@/lib/discord/types'
import { recordOrReplay } from '@/lib/discord/dedup'
import { handleStatus } from '@/lib/discord/commands/status'
import { handleReportModalOpen, handleReportModalSubmit } from '@/lib/discord/commands/report'

export async function POST(req: Request) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-signature-ed25519')
  const timestamp = req.headers.get('x-signature-timestamp')
  const publicKey = process.env.DISCORD_PUBLIC_KEY ?? ''

  if (!verifyDiscordRequest(rawBody, signature, timestamp, publicKey)) {
    return new NextResponse('invalid request signature', { status: 401 })
  }

  const interaction = JSON.parse(rawBody) as DiscordInteraction

  if (interaction.type === InteractionType.PING) {
    return NextResponse.json({ type: ResponseType.PONG })
  }

  if (!interaction.guild_id) {
    return new NextResponse('this bot only handles guild interactions', { status: 400 })
  }

  const commandName = resolveCommandName(interaction)

  // Single round trip for the server lookup, its command config, AND /status's
  // recent-activity read, instead of up to three sequential queries — every
  // extra awaited DB call eats into Discord's 3s budget, and going through a dev
  // tunnel + a cold Supabase pooler connection made that margin real, not
  // theoretical (a /status reply measured 2.5s end to end before this).
  const server = await prisma.server.findUnique({
    where: { discordGuildId: interaction.guild_id },
    include: {
      commands: { where: { commandName } },
      interactions: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  })
  if (!server) {
    return new NextResponse('server not connected', { status: 404 })
  }

  const config = server.commands[0]
  if (config && !config.enabled) {
    after(() => recordOrReplay(interaction, server.id))
    return NextResponse.json({
      type: ResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: `/${commandName} is currently disabled for this server.`, flags: 64 },
    })
  }

  // /report's modal-open and /status have no side effects to guard against
  // duplicates, so their dedup log write doesn't need to block the response —
  // it happens after Discord already has its answer. Only the modal *submit*
  // (which does trigger AI/mirror/DB side effects) awaits recordOrReplay, since
  // it needs isNew to avoid re-running those effects on a Discord retry.
  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    after(() => recordOrReplay(interaction, server.id))
    if (commandName === 'status') return handleStatus(server.interactions)
    if (commandName === 'report') return handleReportModalOpen()
    return new NextResponse('unknown command', { status: 400 })
  }

  if (interaction.type === InteractionType.MODAL_SUBMIT) {
    const { isNew, row } = await recordOrReplay(interaction, server.id)
    return handleReportModalSubmit(interaction, server, row, isNew)
  }

  return new NextResponse('unhandled interaction type', { status: 400 })
}

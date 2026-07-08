import { NextResponse } from 'next/server'
import { verifyDiscordRequest } from '@/lib/discord/verify'
import { prisma } from '@/lib/prisma'
import { InteractionType, ResponseType, DiscordInteraction } from '@/lib/discord/types'
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

  const server = await prisma.server.findUnique({ where: { discordGuildId: interaction.guild_id } })
  if (!server) {
    return new NextResponse('server not connected', { status: 404 })
  }

  const { isNew, row } = await recordOrReplay(interaction, server.id)

  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    if (interaction.data?.name === 'status') return handleStatus(server)
    if (interaction.data?.name === 'report') return handleReportModalOpen()
    return new NextResponse('unknown command', { status: 400 })
  }

  if (interaction.type === InteractionType.MODAL_SUBMIT) {
    return handleReportModalSubmit(interaction, server, row, isNew)
  }

  return new NextResponse('unhandled interaction type', { status: 400 })
}

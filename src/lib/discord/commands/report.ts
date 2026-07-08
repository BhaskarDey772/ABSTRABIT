import { after } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ResponseType, DiscordInteraction } from '@/lib/discord/types'
import type { Server, Interaction } from '@prisma/client'
import { editDeferredResponse, postChannelMessage } from '@/lib/discord/api'
import { triageReport } from '@/lib/ai/nim'
import { applyFlagKeywordsRule } from '@/lib/discord/rules'
import { sendMirror } from '@/lib/mirror'

/** Bare /report invocation: open a modal instead of taking a raw text argument. */
export function handleReportModalOpen() {
  return Response.json({
    type: ResponseType.MODAL,
    data: {
      custom_id: 'report_modal',
      title: 'Submit a report',
      components: [
        {
          type: 1, // action row
          components: [
            {
              type: 4, // text input
              custom_id: 'report_text',
              style: 2, // paragraph
              label: 'What are you reporting?',
              required: true,
              max_length: 1000,
            },
          ],
        },
      ],
    },
  })
}

function extractModalText(interaction: DiscordInteraction): string {
  const value = interaction.data?.components?.[0]?.components?.[0]?.value
  if (!value) throw new Error('modal submitted with no text')
  return value
}

/** Modal submit: defer immediately (stops Discord's 3s clock), do the slow work after responding. */
export async function handleReportModalSubmit(
  interaction: DiscordInteraction,
  server: Server,
  interactionRow: Interaction,
  isNew: boolean
) {
  if (!isNew) {
    // Discord retry of an interaction we've already started/finished processing —
    // ack again, don't re-run AI/mirror/DB side effects.
    return Response.json({ type: ResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE })
  }

  await prisma.interaction.update({
    where: { id: interactionRow.id },
    data: { ackType: ResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE, status: 'PROCESSING' },
  })

  after(() => processReport(interaction, server, interactionRow))

  return Response.json({ type: ResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE })
}

async function processReport(interaction: DiscordInteraction, server: Server, interactionRow: Interaction) {
  const text = extractModalText(interaction)

  const config = await prisma.commandConfig.findUnique({
    where: { serverId_commandName: { serverId: server.id, commandName: 'report' } },
  })

  const flagKeywords = config?.flagKeywords ?? []
  const priority = applyFlagKeywordsRule(text, flagKeywords)

  let aiTag: string | null = priority === 'high' ? 'high-priority' : null
  let aiSummary: string | null = null
  let aiFailed = false

  if (config?.aiEnabled ?? true) {
    const { result, failed } = await triageReport(text)
    aiFailed = failed
    if (result) {
      aiTag = result.tag
      aiSummary = result.summary
    }
  }

  const template = config?.responseTemplate ?? 'Thanks, logged: {{summary}}'
  const responseText = template.replace('{{summary}}', aiSummary ?? text.slice(0, 200))

  try {
    await editDeferredResponse(interaction.token, responseText)
    if (server.replyChannelId) {
      // Best-effort duplicate post to the configured channel — the interaction
      // reply above is the required delivery, this is the "and/or a post to the
      // configured channel" half of the core requirement.
      await postChannelMessage(server.replyChannelId, responseText).catch(() => {})
    }
    await prisma.interaction.update({
      where: { id: interactionRow.id },
      data: { status: 'RESPONDED', aiTag, aiSummary, aiFailed, respondedAt: new Date() },
    })
  } catch (err) {
    await prisma.interaction.update({
      where: { id: interactionRow.id },
      data: {
        status: 'FAILED',
        aiTag,
        aiSummary,
        aiFailed,
        errorLog: { respondError: err instanceof Error ? err.message : String(err) },
      },
    })
  }

  if (!server.mirrorWebhookUrl) {
    await prisma.interaction.update({
      where: { id: interactionRow.id },
      data: { mirrorStatus: 'FAILED', errorLog: { mirrorError: 'no mirror webhook configured for this server' } },
    })
    return
  }

  const mirrorResult = await sendMirror(
    server.mirrorType,
    server.mirrorWebhookUrl,
    `[${server.guildName}] /report (${aiTag ?? 'untagged'}): ${responseText}`
  )

  await prisma.interaction.update({
    where: { id: interactionRow.id },
    data: mirrorResult.ok
      ? { mirrorStatus: 'SENT', mirroredAt: new Date() }
      : { mirrorStatus: 'FAILED', errorLog: { mirrorError: mirrorResult.error } },
  })
}

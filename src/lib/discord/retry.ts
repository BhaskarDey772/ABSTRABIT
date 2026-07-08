import { prisma } from '@/lib/prisma'
import { sendMirror } from '@/lib/mirror'
import { triageReport } from '@/lib/ai/nim'
import { applyFlagKeywordsRule } from '@/lib/discord/rules'
import { processReport } from '@/lib/discord/commands/report'
import type { DiscordInteraction } from '@/lib/discord/types'
import type { Interaction, Server } from '@prisma/client'

const MAX_RETRIES = 5
const STUCK_THRESHOLD_MS = 5 * 60 * 1000

/** Re-sends a failed mirror notification. Shared by the manual dashboard button and the daily cron sweep. */
export async function retryMirror(interaction: Interaction & { server: Server }) {
  if (!interaction.server.mirrorWebhookUrl) {
    return { ok: false as const, reason: 'no mirror webhook configured' }
  }
  if (interaction.retryCount >= MAX_RETRIES) {
    return { ok: false as const, reason: 'max retries reached' }
  }

  const text = `[${interaction.server.guildName}] /${interaction.commandName} (${interaction.aiTag ?? 'untagged'}): ${
    interaction.aiSummary ?? '(no summary)'
  }`
  const result = await sendMirror(interaction.server.mirrorType, interaction.server.mirrorWebhookUrl, text)

  await prisma.interaction.update({
    where: { id: interaction.id },
    data: {
      retryCount: { increment: 1 },
      ...(result.ok
        ? { mirrorStatus: 'SENT', mirroredAt: new Date() }
        : { mirrorStatus: 'FAILED', errorLog: { mirrorError: result.error } }),
    },
  })

  return result.ok ? { ok: true as const } : { ok: false as const, reason: result.error }
}

/** Re-runs AI triage for an interaction whose original AI call failed. Updates the log even if
 *  Discord's interaction token has since expired (~15 min) and the original reply can't be edited. */
export async function retryAiTag(interaction: Interaction & { server: Server }) {
  if (interaction.retryCount >= MAX_RETRIES) {
    return { ok: false as const, reason: 'max retries reached' }
  }

  const config = await prisma.commandConfig.findUnique({
    where: { serverId_commandName: { serverId: interaction.serverId, commandName: interaction.commandName } },
  })

  const rawPayload = interaction.rawPayload as {
    data?: { components?: Array<{ components?: Array<{ value?: string }> }> }
  }
  const text = rawPayload.data?.components?.[0]?.components?.[0]?.value
  if (!text) return { ok: false as const, reason: 'no report text on this interaction' }

  const { result, failed } = await triageReport(text)
  const priority = applyFlagKeywordsRule(text, config?.flagKeywords ?? [])

  await prisma.interaction.update({
    where: { id: interaction.id },
    data: {
      retryCount: { increment: 1 },
      aiFailed: failed,
      aiTag: result?.tag ?? (priority === 'high' ? 'high-priority' : interaction.aiTag),
      aiSummary: result?.summary ?? interaction.aiSummary,
    },
  })

  return failed ? { ok: false as const, reason: 'AI still unavailable' } : { ok: true as const }
}

export function isStuckProcessing(interaction: Interaction): boolean {
  return interaction.status === 'PROCESSING' && Date.now() - interaction.createdAt.getTime() > STUCK_THRESHOLD_MS
}

/**
 * Re-drives a /report whose background processing (the after() callback in
 * handleReportModalSubmit) never reached a terminal state — observed in dev when
 * a file-change hot-reload interrupts the in-flight callback; the same gap would
 * open in production if the function crashed or was recycled mid-request. Safe to
 * re-run: AI/mirror aren't side-effecting on our end, and editing the original
 * Discord reply is a no-op past its ~15min token window (caught and logged
 * inside processReport, not thrown) rather than something that duplicates output.
 */
export async function retryStuckReport(interaction: Interaction & { server: Server }) {
  if (interaction.retryCount >= MAX_RETRIES) {
    return { ok: false as const, reason: 'max retries reached' }
  }

  await prisma.interaction.update({ where: { id: interaction.id }, data: { retryCount: { increment: 1 } } })
  await processReport(interaction.rawPayload as unknown as DiscordInteraction, interaction.server, interaction)
  return { ok: true as const }
}

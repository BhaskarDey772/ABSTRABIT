import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { DiscordInteraction, InteractionType, getDiscordUserId } from '@/lib/discord/types'

function resolveCommandName(interaction: DiscordInteraction): string {
  if (interaction.type === InteractionType.MODAL_SUBMIT) {
    // custom_id is namespaced like "report_modal" -> "report"
    return (interaction.data?.custom_id ?? 'unknown').replace(/_modal$/, '')
  }
  return interaction.data?.name ?? 'unknown'
}

/**
 * Records a new interaction, or returns the already-recorded row if this is a
 * Discord retry of an interaction id we've already seen (dedup on the DB's
 * unique constraint, not an app-level check, so it holds under concurrent retries).
 */
export async function recordOrReplay(interaction: DiscordInteraction, serverId: string) {
  try {
    const row = await prisma.interaction.create({
      data: {
        discordInteractionId: interaction.id,
        serverId,
        commandName: resolveCommandName(interaction),
        discordUserId: getDiscordUserId(interaction),
        rawPayload: interaction as unknown as Prisma.InputJsonValue,
        interactionType: String(interaction.type),
      },
    })
    return { isNew: true as const, row }
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const row = await prisma.interaction.findUniqueOrThrow({
        where: { discordInteractionId: interaction.id },
      })
      return { isNew: false as const, row }
    }
    throw err
  }
}

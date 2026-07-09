import { Prisma, type InteractionStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { DiscordInteraction, getDiscordUserId, resolveCommandName } from '@/lib/discord/types'

/**
 * Records a new interaction, or returns the already-recorded row if this is a
 * Discord retry of an interaction id we've already seen (dedup on the DB's
 * unique constraint, not an app-level check, so it holds under concurrent retries).
 *
 * `initial` lets a caller that's about to defer (e.g. /report's modal submit)
 * set ackType/status in this same insert instead of a follow-up update() -
 * one write instead of two on the path that's racing Discord's 3s deadline.
 */
export async function recordOrReplay(
  interaction: DiscordInteraction,
  serverId: string,
  initial?: { ackType?: number; status?: InteractionStatus }
) {
  try {
    const row = await prisma.interaction.create({
      data: {
        discordInteractionId: interaction.id,
        serverId,
        commandName: resolveCommandName(interaction),
        discordUserId: getDiscordUserId(interaction),
        rawPayload: interaction as unknown as Prisma.InputJsonValue,
        interactionType: String(interaction.type),
        ...initial,
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

'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { getOwnedServer } from '@/lib/servers'
import { prisma } from '@/lib/prisma'
import { retryMirror, retryAiTag } from '@/lib/discord/retry'

async function loadOwnedInteraction(interactionId: string, serverId: string) {
  const admin = await requireAdmin()
  const server = await getOwnedServer(admin, serverId)
  const interaction = await prisma.interaction.findUniqueOrThrow({ where: { id: interactionId } })
  return { interaction: { ...interaction, server } }
}

export async function retryMirrorAction(formData: FormData) {
  const interactionId = String(formData.get('interactionId'))
  const serverId = String(formData.get('serverId'))
  const { interaction } = await loadOwnedInteraction(interactionId, serverId)
  await retryMirror(interaction)
  revalidatePath(`/servers/${serverId}/log`)
}

export async function retryAiTagAction(formData: FormData) {
  const interactionId = String(formData.get('interactionId'))
  const serverId = String(formData.get('serverId'))
  const { interaction } = await loadOwnedInteraction(interactionId, serverId)
  await retryAiTag(interaction)
  revalidatePath(`/servers/${serverId}/log`)
}

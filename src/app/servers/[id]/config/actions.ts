'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { getOwnedServer } from '@/lib/servers'
import { prisma } from '@/lib/prisma'
import type { MirrorType } from '@prisma/client'

export async function updateServerSettings(formData: FormData) {
  const admin = await requireAdmin()
  const serverId = String(formData.get('serverId'))
  await getOwnedServer(admin, serverId)

  const replyChannelIdRaw = String(formData.get('replyChannelId') || '')
  const replyChannelId = replyChannelIdRaw && replyChannelIdRaw !== 'none' ? replyChannelIdRaw : null
  const mirrorType = String(formData.get('mirrorType')) as MirrorType
  const mirrorWebhookUrl = String(formData.get('mirrorWebhookUrl') || '') || null

  await prisma.server.update({
    where: { id: serverId },
    data: { replyChannelId, mirrorType, mirrorWebhookUrl },
  })

  revalidatePath(`/servers/${serverId}/config`)
}

export async function updateCommandConfig(formData: FormData) {
  const admin = await requireAdmin()
  const serverId = String(formData.get('serverId'))
  await getOwnedServer(admin, serverId)

  const commandName = String(formData.get('commandName'))
  const enabled = formData.get('enabled') === 'on'
  const aiEnabled = formData.get('aiEnabled') === 'on'
  const responseTemplate = String(formData.get('responseTemplate') || 'Thanks, logged: {{summary}}')
  const flagKeywords = String(formData.get('flagKeywords') || '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)

  await prisma.commandConfig.update({
    where: { serverId_commandName: { serverId, commandName } },
    data: { enabled, aiEnabled, responseTemplate, flagKeywords },
  })

  revalidatePath(`/servers/${serverId}/config`)
}

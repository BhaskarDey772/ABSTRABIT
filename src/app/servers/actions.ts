'use server'

import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { fetchManageableGuilds, fetchBotGuildIds } from '@/lib/discord/api'

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function connectServer(formData: FormData) {
  const admin = await requireAdmin()
  const guildId = String(formData.get('guildId'))
  const guildName = String(formData.get('guildName'))

  if (!admin.discordAccessToken) redirect('/login')

  // Re-verify the admin actually has Manage Server on this guild and the bot is
  // present, rather than trusting the hidden form fields.
  const [manageable, botGuildIds] = await Promise.all([
    fetchManageableGuilds(admin.discordAccessToken),
    fetchBotGuildIds(),
  ])
  if (!manageable.some((g) => g.id === guildId) || !botGuildIds.has(guildId)) {
    throw new Error('not authorized to connect this server, or bot not present')
  }

  const server = await prisma.server.upsert({
    where: { discordGuildId: guildId },
    create: { discordGuildId: guildId, guildName, connectedById: admin.id },
    update: { guildName },
  })

  await prisma.commandConfig.createMany({
    data: [
      { serverId: server.id, commandName: 'report' },
      { serverId: server.id, commandName: 'status' },
    ],
    skipDuplicates: true,
  })

  redirect(`/servers/${server.id}/config`)
}

import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import type { AdminUser } from '@prisma/client'

/** Loads a server, 404s if it doesn't exist or isn't owned by this admin. */
export async function getOwnedServer(admin: AdminUser, serverId: string) {
  const server = await prisma.server.findUnique({ where: { id: serverId } })
  if (!server || server.connectedById !== admin.id) notFound()
  return server
}

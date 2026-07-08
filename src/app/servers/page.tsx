import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function ServersPage() {
  const admin = await requireAdmin()
  const servers = await prisma.server.findMany({ where: { connectedById: admin.id } })

  return (
    <main className="mx-auto max-w-2xl p-8 text-neutral-100">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Connected servers</h1>
        <Link href="/servers/connect" className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm hover:bg-indigo-500">
          Connect a server
        </Link>
      </div>

      {servers.length === 0 ? (
        <p className="text-neutral-400">No servers connected yet.</p>
      ) : (
        <ul className="space-y-2">
          {servers.map((s) => (
            <li key={s.id}>
              <Link
                href={`/servers/${s.id}/log`}
                className="block rounded-md border border-neutral-800 p-4 hover:border-neutral-600"
              >
                <div className="font-medium">{s.guildName}</div>
                <div className="text-sm text-neutral-400">
                  {s.mirrorWebhookUrl ? `Mirror: ${s.mirrorType}` : 'Mirror not configured yet'}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function ServersPage() {
  const admin = await requireAdmin()
  const servers = await prisma.server.findMany({ where: { connectedById: admin.id } })

  return (
    <main className="mx-auto max-w-2xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Connected servers</h1>
        <Link href="/servers/connect" className={buttonVariants()}>
          Connect a server
        </Link>
      </div>

      {servers.length === 0 ? (
        <Card>
          <CardHeader>
            <CardDescription>No servers connected yet.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-3">
          {servers.map((s) => (
            <Link key={s.id} href={`/servers/${s.id}/log`}>
              <Card className="transition-colors hover:border-primary/50">
                <CardHeader>
                  <CardTitle className="text-base">{s.guildName}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    {s.mirrorWebhookUrl ? (
                      <Badge variant="secondary">{s.mirrorType} mirror configured</Badge>
                    ) : (
                      <Badge variant="outline">Mirror not configured yet</Badge>
                    )}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}

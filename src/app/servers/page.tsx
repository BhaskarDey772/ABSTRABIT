import Link from 'next/link'
import { Plus, ChevronRight } from 'lucide-react'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/page-header'

export default async function ServersPage() {
  const admin = await requireAdmin()
  const servers = await prisma.server.findMany({ where: { connectedById: admin.id } })

  return (
    <main className="mx-auto max-w-4xl px-10 py-8">
      <div className="mb-8 flex items-start justify-between">
        <PageHeader
          title="Connected servers"
          description="Discord servers you administer through this dashboard."
        />
        <Link href="/servers/connect" className={buttonVariants({ className: 'gap-1.5' })}>
          <Plus className="size-4" />
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
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base">{s.guildName}</CardTitle>
                    <CardDescription className="mt-1.5 flex items-center gap-2">
                      {s.mirrorWebhookUrl ? (
                        <Badge variant="secondary">{s.mirrorType} mirror configured</Badge>
                      ) : (
                        <Badge variant="outline">Mirror not configured yet</Badge>
                      )}
                    </CardDescription>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}

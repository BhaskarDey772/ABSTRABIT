import Link from 'next/link'
import { Plus, ChevronRight, Zap, AlertCircle } from 'lucide-react'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/page-header'

export default async function ServersPage() {
  const admin = await requireAdmin()
  const servers = await prisma.server.findMany({ where: { connectedById: admin.id } })

  return (
    <main className="mx-auto max-w-5xl px-8 py-10">
      <div className="mb-10 flex items-end justify-between">
        <PageHeader
          title="Connected servers"
          description="Manage your Discord servers and command configurations."
        />
        <Link href="/servers/connect" className={buttonVariants({ size: 'lg', className: 'gap-2' })}>
          <Plus className="size-5" />
          Connect a server
        </Link>
      </div>

      {servers.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Zap className="size-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No servers connected</h3>
            <p className="text-muted-foreground mb-6">Connect your first Discord server to get started.</p>
            <Link href="/servers/connect" className={buttonVariants({ variant: 'default' })}>
              <Plus className="size-4" />
              Connect a server
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {servers.map((s) => (
            <Link key={s.id} href={`/servers/${s.id}/log`} className="group">
              <Card className="h-full transition-all duration-300 hover:shadow-lg hover:border-primary/50 hover:bg-card/80 cursor-pointer border border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors truncate">
                        {s.guildName}
                      </CardTitle>
                      <CardDescription className="mt-2 text-xs uppercase tracking-wide">
                        Server Configuration
                      </CardDescription>
                    </div>
                    <ChevronRight className="size-5 text-muted-foreground group-hover:translate-x-1 transition-transform flex-shrink-0" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {s.mirrorWebhookUrl ? (
                      <Badge variant="secondary" className="gap-1.5">
                        <span className="size-1.5 rounded-full bg-green-500" />
                        {s.mirrorType} mirror active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1.5">
                        <AlertCircle className="size-3" />
                        Mirror pending
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="px-2 py-1 rounded bg-muted/50">ID: {s.id.substring(0, 8)}...</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}

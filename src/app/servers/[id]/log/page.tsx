import type { ElementType } from 'react'
import Link from 'next/link'
import { CheckCircle2, XCircle, Clock, Loader2, RefreshCw, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'
import { requireAdmin } from '@/lib/auth'
import { getOwnedServer } from '@/lib/servers'
import { prisma } from '@/lib/prisma'
import { retryMirrorAction, retryAiTagAction, retryStuckReportAction } from './actions'
import { isStuckProcessing } from '@/lib/discord/retry'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SubmitButton } from '@/components/submit-button'
import { buttonVariants } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 20

const statusVariant: Record<string, 'secondary' | 'outline' | 'default' | 'destructive'> = {
  RECEIVED: 'outline',
  PROCESSING: 'secondary',
  RESPONDED: 'default',
  FAILED: 'destructive',
}

const statusIcon: Record<string, ElementType> = {
  RECEIVED: Clock,
  PROCESSING: Loader2,
  RESPONDED: CheckCircle2,
  FAILED: XCircle,
}

export default async function ServerLogPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { id } = await params
  const { page: pageParam } = await searchParams
  const admin = await requireAdmin()
  const server = await getOwnedServer(admin, id)

  const page = Math.max(1, Number(pageParam) || 1)

  const [interactions, total] = await Promise.all([
    prisma.interaction.findMany({
      where: { serverId: server.id },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.interaction.count({ where: { serverId: server.id } }),
  ])
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div>
      <PageHeader title={`${server.guildName} — command log`} description="Every interaction the bot has received for this server, most recent first." />
      <div className="space-y-3">
        {interactions.length === 0 && <p className="text-muted-foreground">Nothing logged yet.</p>}
        {interactions.map((i) => {
          const StatusIcon = statusIcon[i.status]
          return (
            <Card key={i.id}>
              <CardContent>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm">/{i.commandName}</span>
                  <Badge variant={statusVariant[i.status]} className="gap-1">
                    <StatusIcon className={`size-3 ${i.status === 'PROCESSING' ? 'animate-spin' : ''}`} />
                    {i.status}
                  </Badge>
                  {i.aiTag && <Badge variant="secondary">{i.aiTag}</Badge>}
                  {i.aiFailed && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="size-3" />
                      AI failed, rule-only
                    </Badge>
                  )}
                  {i.mirrorStatus === 'FAILED' && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="size-3" />
                      mirror failed
                    </Badge>
                  )}
                  {isStuckProcessing(i) && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="size-3" />
                      stuck processing
                    </Badge>
                  )}
                  {i.retryCount > 0 && (
                    <span className="text-xs text-muted-foreground">retries: {i.retryCount}</span>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground">{i.createdAt.toLocaleString()}</span>
                </div>

                {i.aiSummary && <p className="mt-2 text-sm text-foreground">{i.aiSummary}</p>}

                {(i.mirrorStatus === 'FAILED' || i.aiFailed || isStuckProcessing(i)) && (
                  <div className="mt-3 flex gap-2">
                    {isStuckProcessing(i) && (
                      <form action={retryStuckReportAction}>
                        <input type="hidden" name="interactionId" value={i.id} />
                        <input type="hidden" name="serverId" value={server.id} />
                        <SubmitButton variant="secondary" size="sm" pendingText="Retrying…" className="gap-1.5">
                          <RefreshCw className="size-3.5" />
                          Retry report
                        </SubmitButton>
                      </form>
                    )}
                    {i.mirrorStatus === 'FAILED' && (
                      <form action={retryMirrorAction}>
                        <input type="hidden" name="interactionId" value={i.id} />
                        <input type="hidden" name="serverId" value={server.id} />
                        <SubmitButton variant="secondary" size="sm" pendingText="Retrying…" className="gap-1.5">
                          <RefreshCw className="size-3.5" />
                          Retry mirror
                        </SubmitButton>
                      </form>
                    )}
                    {i.aiFailed && (
                      <form action={retryAiTagAction}>
                        <input type="hidden" name="interactionId" value={i.id} />
                        <input type="hidden" name="serverId" value={server.id} />
                        <SubmitButton variant="secondary" size="sm" pendingText="Retrying…" className="gap-1.5">
                          <RefreshCw className="size-3.5" />
                          Retry AI tagging
                        </SubmitButton>
                      </form>
                    )}
                  </div>
                )}

                {i.errorLog != null && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs text-muted-foreground">error details</summary>
                    <pre className="mt-1 overflow-x-auto rounded-md bg-muted p-2 text-xs text-muted-foreground">
                      {JSON.stringify(i.errorLog, null, 2)}
                    </pre>
                  </details>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm">
          <Link
            href={`/servers/${server.id}/log?page=${page - 1}`}
            aria-disabled={page <= 1}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), page <= 1 && 'pointer-events-none opacity-50')}
          >
            <ChevronLeft className="size-4" />
            Previous
          </Link>
          <span className="text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Link
            href={`/servers/${server.id}/log?page=${page + 1}`}
            aria-disabled={page >= totalPages}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), page >= totalPages && 'pointer-events-none opacity-50')}
          >
            Next
            <ChevronRight className="size-4" />
          </Link>
        </div>
      )}
    </div>
  )
}

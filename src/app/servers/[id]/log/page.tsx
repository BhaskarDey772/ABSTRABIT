import type { ElementType } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Zap,
} from 'lucide-react'
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
      <PageHeader 
        title={`${server.guildName} — Interaction Log`} 
        description="Track and manage every bot interaction for this server."
      />
      <div className="max-w-4xl">
        {interactions.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Zap className="size-10 text-muted-foreground mb-3 opacity-50" />
              <p className="text-muted-foreground">No interactions logged yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {interactions.map((i) => {
              const StatusIcon = statusIcon[i.status]
              const hasIssues = i.mirrorStatus === 'FAILED' || i.aiFailed || isStuckProcessing(i)
              
              return (
                <Card key={i.id} className={cn('border border-border/50 transition-colors', hasIssues && 'border-destructive/30 bg-destructive/5')}>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      {/* Header row */}
                      <div className="flex flex-wrap items-center gap-2 justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className="font-mono text-sm font-semibold bg-muted/50 px-2.5 py-1.5 rounded">/{i.commandName}</code>
                          <Badge variant={statusVariant[i.status]} className="gap-1.5">
                            <StatusIcon className={`size-3.5 ${i.status === 'PROCESSING' ? 'animate-spin' : ''}`} />
                            {i.status}
                          </Badge>
                          {i.retryCount > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {i.retryCount} retries
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {i.createdAt.toLocaleString()}
                        </span>
                      </div>

                      {/* Tags and status badges */}
                      <div className="flex flex-wrap gap-2 items-center">
                        {i.aiTag && (
                          <Badge variant="secondary" className="text-xs">
                            {i.aiTag}
                          </Badge>
                        )}
                        {i.aiFailed && (
                          <Badge variant="destructive" className="gap-1 text-xs">
                            <AlertTriangle className="size-3" />
                            AI failed
                          </Badge>
                        )}
                        {i.mirrorStatus === 'FAILED' && (
                          <Badge variant="destructive" className="gap-1 text-xs">
                            <AlertTriangle className="size-3" />
                            Mirror failed
                          </Badge>
                        )}
                        {isStuckProcessing(i) && (
                          <Badge variant="destructive" className="gap-1 text-xs">
                            <AlertTriangle className="size-3" />
                            Stuck
                          </Badge>
                        )}
                      </div>

                      {/* Summary */}
                      {i.aiSummary && (
                        <p className="text-sm text-foreground bg-muted/30 rounded p-3 border border-muted/50">
                          {i.aiSummary}
                        </p>
                      )}

                      {/* Action buttons */}
                      {hasIssues && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {isStuckProcessing(i) && (
                            <form action={retryStuckReportAction}>
                              <input type="hidden" name="interactionId" value={i.id} />
                              <input type="hidden" name="serverId" value={server.id} />
                              <SubmitButton variant="secondary" size="sm" pendingText="Retrying…" className="gap-1.5">
                                <RefreshCw className="size-3.5" />
                                <span className="hidden sm:inline">Retry Report</span>
                              </SubmitButton>
                            </form>
                          )}
                          {i.mirrorStatus === 'FAILED' && (
                            <form action={retryMirrorAction}>
                              <input type="hidden" name="interactionId" value={i.id} />
                              <input type="hidden" name="serverId" value={server.id} />
                              <SubmitButton variant="secondary" size="sm" pendingText="Retrying…" className="gap-1.5">
                                <RefreshCw className="size-3.5" />
                                <span className="hidden sm:inline">Retry Mirror</span>
                              </SubmitButton>
                            </form>
                          )}
                          {i.aiFailed && (
                            <form action={retryAiTagAction}>
                              <input type="hidden" name="interactionId" value={i.id} />
                              <input type="hidden" name="serverId" value={server.id} />
                              <SubmitButton variant="secondary" size="sm" pendingText="Retrying…" className="gap-1.5">
                                <RefreshCw className="size-3.5" />
                                <span className="hidden sm:inline">Retry AI</span>
                              </SubmitButton>
                            </form>
                          )}
                        </div>
                      )}

                      {/* Error details */}
                      {i.errorLog != null && (
                        <details className="pt-2">
                          <summary className="cursor-pointer text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                            Show error details
                          </summary>
                          <pre className="mt-2 overflow-x-auto rounded-md bg-muted/50 p-3 text-xs text-muted-foreground border border-muted/50 max-h-48 overflow-y-auto">
                            {JSON.stringify(i.errorLog, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Link
                href={`/servers/${server.id}/log?page=1`}
                aria-disabled={page <= 1}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), page <= 1 && 'pointer-events-none opacity-50')}
              >
                <ChevronsLeft className="size-4" />
                First
              </Link>
              <Link
                href={`/servers/${server.id}/log?page=${page - 1}`}
                aria-disabled={page <= 1}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), page <= 1 && 'pointer-events-none opacity-50')}
              >
                <ChevronLeft className="size-4" />
                Previous
              </Link>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Page</span>
              <span className="font-semibold">{page}</span>
              <span className="text-muted-foreground">of</span>
              <span className="font-semibold">{totalPages}</span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/servers/${server.id}/log?page=${page + 1}`}
                aria-disabled={page >= totalPages}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), page >= totalPages && 'pointer-events-none opacity-50')}
              >
                Next
                <ChevronRight className="size-4" />
              </Link>
              <Link
                href={`/servers/${server.id}/log?page=${totalPages}`}
                aria-disabled={page >= totalPages}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), page >= totalPages && 'pointer-events-none opacity-50')}
              >
                Last
                <ChevronsRight className="size-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

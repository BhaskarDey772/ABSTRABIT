import { requireAdmin } from '@/lib/auth'
import { getOwnedServer } from '@/lib/servers'
import { prisma } from '@/lib/prisma'
import { retryMirrorAction, retryAiTagAction, retryStuckReportAction } from './actions'
import { isStuckProcessing } from '@/lib/discord/retry'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SubmitButton } from '@/components/submit-button'
import { PageHeader } from '@/components/page-header'

const statusVariant: Record<string, 'secondary' | 'outline' | 'default' | 'destructive'> = {
  RECEIVED: 'outline',
  PROCESSING: 'secondary',
  RESPONDED: 'default',
  FAILED: 'destructive',
}

export default async function ServerLogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = await requireAdmin()
  const server = await getOwnedServer(admin, id)

  const interactions = await prisma.interaction.findMany({
    where: { serverId: server.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return (
    <div>
      <PageHeader title={`${server.guildName} — command log`} description="Every interaction the bot has received for this server, most recent first." />
      <div className="space-y-3">
        {interactions.length === 0 && <p className="text-muted-foreground">Nothing logged yet.</p>}
        {interactions.map((i) => (
          <Card key={i.id}>
            <CardContent>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm">/{i.commandName}</span>
                <Badge variant={statusVariant[i.status]}>{i.status}</Badge>
                {i.aiTag && <Badge variant="secondary">{i.aiTag}</Badge>}
                {i.aiFailed && <Badge variant="destructive">AI failed, rule-only</Badge>}
                {i.mirrorStatus === 'FAILED' && <Badge variant="destructive">mirror failed</Badge>}
                {isStuckProcessing(i) && <Badge variant="destructive">stuck processing</Badge>}
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
                      <SubmitButton variant="secondary" size="sm" pendingText="Retrying…">
                        Retry report
                      </SubmitButton>
                    </form>
                  )}
                  {i.mirrorStatus === 'FAILED' && (
                    <form action={retryMirrorAction}>
                      <input type="hidden" name="interactionId" value={i.id} />
                      <input type="hidden" name="serverId" value={server.id} />
                      <SubmitButton variant="secondary" size="sm" pendingText="Retrying…">
                        Retry mirror
                      </SubmitButton>
                    </form>
                  )}
                  {i.aiFailed && (
                    <form action={retryAiTagAction}>
                      <input type="hidden" name="interactionId" value={i.id} />
                      <input type="hidden" name="serverId" value={server.id} />
                      <SubmitButton variant="secondary" size="sm" pendingText="Retrying…">
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
        ))}
      </div>
    </div>
  )
}

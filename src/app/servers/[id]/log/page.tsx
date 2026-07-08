import { requireAdmin } from '@/lib/auth'
import { getOwnedServer } from '@/lib/servers'
import { prisma } from '@/lib/prisma'
import { retryMirrorAction, retryAiTagAction, retryStuckReportAction } from './actions'
import { isStuckProcessing } from '@/lib/discord/retry'

const statusColor: Record<string, string> = {
  RECEIVED: 'text-neutral-400',
  PROCESSING: 'text-amber-400',
  RESPONDED: 'text-emerald-400',
  FAILED: 'text-red-400',
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
      <h1 className="mb-4 text-lg font-semibold">{server.guildName} — command log</h1>
      <div className="space-y-2">
        {interactions.length === 0 && <p className="text-neutral-400">Nothing logged yet.</p>}
        {interactions.map((i) => (
          <div key={i.id} className="rounded-md border border-neutral-800 p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono">/{i.commandName}</span>
              <span className={statusColor[i.status]}>{i.status}</span>
              {i.aiTag && <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs">{i.aiTag}</span>}
              {i.aiFailed && <span className="text-xs text-amber-500">AI failed, rule-only</span>}
              {i.mirrorStatus === 'FAILED' && <span className="text-xs text-red-400">mirror failed</span>}
              {isStuckProcessing(i) && <span className="text-xs text-amber-500">stuck processing</span>}
              {i.retryCount > 0 && <span className="text-xs text-neutral-500">retries: {i.retryCount}</span>}
              <span className="ml-auto text-neutral-500">{i.createdAt.toLocaleString()}</span>
            </div>

            {i.aiSummary && <p className="mt-1 text-neutral-300">{i.aiSummary}</p>}

            {(i.mirrorStatus === 'FAILED' || i.aiFailed || isStuckProcessing(i)) && (
              <div className="mt-2 flex gap-2">
                {isStuckProcessing(i) && (
                  <form action={retryStuckReportAction}>
                    <input type="hidden" name="interactionId" value={i.id} />
                    <input type="hidden" name="serverId" value={server.id} />
                    <button className="rounded bg-neutral-800 px-2 py-1 text-xs hover:bg-neutral-700">
                      Retry report
                    </button>
                  </form>
                )}
                {i.mirrorStatus === 'FAILED' && (
                  <form action={retryMirrorAction}>
                    <input type="hidden" name="interactionId" value={i.id} />
                    <input type="hidden" name="serverId" value={server.id} />
                    <button className="rounded bg-neutral-800 px-2 py-1 text-xs hover:bg-neutral-700">
                      Retry mirror
                    </button>
                  </form>
                )}
                {i.aiFailed && (
                  <form action={retryAiTagAction}>
                    <input type="hidden" name="interactionId" value={i.id} />
                    <input type="hidden" name="serverId" value={server.id} />
                    <button className="rounded bg-neutral-800 px-2 py-1 text-xs hover:bg-neutral-700">
                      Retry AI tagging
                    </button>
                  </form>
                )}
              </div>
            )}

            {i.errorLog != null && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-neutral-500">error details</summary>
                <pre className="mt-1 overflow-x-auto rounded bg-neutral-900 p-2 text-xs text-neutral-400">
                  {JSON.stringify(i.errorLog, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

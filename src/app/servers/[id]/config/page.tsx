import { requireAdmin } from '@/lib/auth'
import { getOwnedServer } from '@/lib/servers'
import { prisma } from '@/lib/prisma'
import { fetchGuildChannels } from '@/lib/discord/api'
import { updateServerSettings, updateCommandConfig } from './actions'

const TEXT_CHANNEL = 0

export default async function ServerConfigPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = await requireAdmin()
  const server = await getOwnedServer(admin, id)

  const [channels, commands] = await Promise.all([
    fetchGuildChannels(server.discordGuildId).catch(() => []),
    prisma.commandConfig.findMany({ where: { serverId: server.id }, orderBy: { commandName: 'asc' } }),
  ])
  const textChannels = channels.filter((c) => c.type === TEXT_CHANNEL)

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-lg font-semibold">Server settings</h2>
        <form action={updateServerSettings} className="space-y-3">
          <input type="hidden" name="serverId" value={server.id} />

          <label className="block text-sm">
            Reply channel
            <select
              name="replyChannelId"
              defaultValue={server.replyChannelId ?? ''}
              className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 p-2"
            >
              <option value="">(interaction reply only, no channel post)</option>
              {textChannels.map((c) => (
                <option key={c.id} value={c.id}>
                  #{c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            Mirror type
            <select
              name="mirrorType"
              defaultValue={server.mirrorType}
              className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 p-2"
            >
              <option value="SLACK">Slack</option>
              <option value="DISCORD">Discord</option>
            </select>
          </label>

          <label className="block text-sm">
            Mirror webhook URL
            <input
              type="url"
              name="mirrorWebhookUrl"
              defaultValue={server.mirrorWebhookUrl ?? ''}
              placeholder="https://hooks.slack.com/services/... or https://discord.com/api/webhooks/..."
              className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 p-2"
            />
          </label>

          <button className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm hover:bg-indigo-500">Save</button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Commands</h2>
        <div className="space-y-4">
          {commands.map((c) => (
            <form
              key={c.id}
              action={updateCommandConfig}
              className="space-y-2 rounded-md border border-neutral-800 p-4"
            >
              <input type="hidden" name="serverId" value={server.id} />
              <input type="hidden" name="commandName" value={c.commandName} />
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm">/{c.commandName}</span>
                <label className="flex items-center gap-1 text-xs">
                  <input type="checkbox" name="enabled" defaultChecked={c.enabled} /> enabled
                </label>
              </div>

              <label className="block text-sm">
                Response template
                <input
                  type="text"
                  name="responseTemplate"
                  defaultValue={c.responseTemplate}
                  className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 p-2"
                />
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="aiEnabled" defaultChecked={c.aiEnabled} /> AI tagging/summary
              </label>

              <label className="block text-sm">
                Flag keywords (comma-separated, marks a report high-priority)
                <input
                  type="text"
                  name="flagKeywords"
                  defaultValue={c.flagKeywords.join(', ')}
                  className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 p-2"
                />
              </label>

              <button className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm hover:bg-indigo-500">Save</button>
            </form>
          ))}
        </div>
      </section>
    </div>
  )
}

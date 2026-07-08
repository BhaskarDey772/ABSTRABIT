import { requireAdmin } from '@/lib/auth'
import { getOwnedServer } from '@/lib/servers'
import { prisma } from '@/lib/prisma'
import { fetchGuildChannels } from '@/lib/discord/api'
import { updateServerSettings, updateCommandConfig } from './actions'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const TEXT_CHANNEL = 0

const selectClass =
  'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

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
      <Card>
        <CardHeader>
          <CardTitle>Server settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateServerSettings} className="space-y-4">
            <input type="hidden" name="serverId" value={server.id} />

            <div className="space-y-1.5">
              <Label htmlFor="replyChannelId">Reply channel</Label>
              <select
                id="replyChannelId"
                name="replyChannelId"
                defaultValue={server.replyChannelId ?? ''}
                className={selectClass}
              >
                <option value="">(interaction reply only, no channel post)</option>
                {textChannels.map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mirrorType">Mirror type</Label>
              <select id="mirrorType" name="mirrorType" defaultValue={server.mirrorType} className={selectClass}>
                <option value="SLACK">Slack</option>
                <option value="DISCORD">Discord</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mirrorWebhookUrl">Mirror webhook URL</Label>
              <Input
                id="mirrorWebhookUrl"
                type="url"
                name="mirrorWebhookUrl"
                defaultValue={server.mirrorWebhookUrl ?? ''}
                placeholder="https://hooks.slack.com/services/... or https://discord.com/api/webhooks/..."
              />
            </div>

            <Button type="submit">Save</Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Commands</h2>
        <div className="space-y-4">
          {commands.map((c) => (
            <Card key={c.id}>
              <CardContent>
                <form action={updateCommandConfig} className="space-y-4">
                  <input type="hidden" name="serverId" value={server.id} />
                  <input type="hidden" name="commandName" value={c.commandName} />

                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm">/{c.commandName}</span>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="enabled"
                        defaultChecked={c.enabled}
                        className="accent-primary"
                      />
                      enabled
                    </label>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor={`responseTemplate-${c.id}`}>Response template</Label>
                    <Input
                      id={`responseTemplate-${c.id}`}
                      type="text"
                      name="responseTemplate"
                      defaultValue={c.responseTemplate}
                    />
                  </div>

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="aiEnabled"
                      defaultChecked={c.aiEnabled}
                      className="accent-primary"
                    />
                    AI tagging/summary
                  </label>

                  <div className="space-y-1.5">
                    <Label htmlFor={`flagKeywords-${c.id}`}>
                      Flag keywords (comma-separated, marks a report high-priority)
                    </Label>
                    <Input
                      id={`flagKeywords-${c.id}`}
                      type="text"
                      name="flagKeywords"
                      defaultValue={c.flagKeywords.join(', ')}
                    />
                  </div>

                  <Button type="submit">Save</Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

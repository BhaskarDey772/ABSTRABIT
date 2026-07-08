import { Save, SlidersHorizontal } from 'lucide-react'
import { requireAdmin } from '@/lib/auth'
import { getOwnedServer } from '@/lib/servers'
import { prisma } from '@/lib/prisma'
import { fetchGuildChannels } from '@/lib/discord/api'
import { updateServerSettings, updateCommandConfig } from './actions'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { SubmitButton } from '@/components/submit-button'
import { PageHeader } from '@/components/page-header'

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
    <div>
      <PageHeader
        title="Configuration"
        description={`Reply channel, mirror target, and per-command behavior for ${server.guildName}.`}
      />
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Server settings</CardTitle>
            <CardDescription>Where the bot replies and mirrors notifications.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateServerSettings} className="space-y-4">
              <input type="hidden" name="serverId" value={server.id} />

              <div className="space-y-1.5">
                <Label htmlFor="replyChannelId">Reply channel</Label>
                <Select key={server.replyChannelId ?? 'none'} name="replyChannelId" defaultValue={server.replyChannelId ?? 'none'}>
                  <SelectTrigger id="replyChannelId" className="w-full">
                    <SelectValue placeholder="Select a channel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">(interaction reply only, no channel post)</SelectItem>
                    {textChannels.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        #{c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mirrorType">Mirror type</Label>
                <Select key={server.mirrorType} name="mirrorType" defaultValue={server.mirrorType}>
                  <SelectTrigger id="mirrorType" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SLACK">Slack</SelectItem>
                    <SelectItem value="DISCORD">Discord</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mirrorWebhookUrl">Mirror webhook URL</Label>
                <Input
                  key={server.mirrorWebhookUrl ?? 'none'}
                  id="mirrorWebhookUrl"
                  type="url"
                  name="mirrorWebhookUrl"
                  defaultValue={server.mirrorWebhookUrl ?? ''}
                  placeholder="https://hooks.slack.com/services/... or https://discord.com/api/webhooks/..."
                />
              </div>

              <SubmitButton className="gap-1.5">
                <Save className="size-4" />
                Save
              </SubmitButton>
            </form>
          </CardContent>
        </Card>

        <div>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <SlidersHorizontal className="size-4 text-muted-foreground" />
            Commands
          </h2>
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
                        <Checkbox key={String(c.enabled)} name="enabled" value="on" defaultChecked={c.enabled} />
                        enabled
                      </label>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor={`responseTemplate-${c.id}`}>Response template</Label>
                      <Input
                        key={c.responseTemplate}
                        id={`responseTemplate-${c.id}`}
                        type="text"
                        name="responseTemplate"
                        defaultValue={c.responseTemplate}
                      />
                    </div>

                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox key={String(c.aiEnabled)} name="aiEnabled" value="on" defaultChecked={c.aiEnabled} />
                      AI tagging/summary
                    </label>

                    <div className="space-y-1.5">
                      <Label htmlFor={`flagKeywords-${c.id}`}>
                        Flag keywords (comma-separated, marks a report high-priority)
                      </Label>
                      <Input
                        key={c.flagKeywords.join(',')}
                        id={`flagKeywords-${c.id}`}
                        type="text"
                        name="flagKeywords"
                        defaultValue={c.flagKeywords.join(', ')}
                      />
                    </div>

                    <SubmitButton className="gap-1.5">
                      <Save className="size-4" />
                      Save
                    </SubmitButton>
                  </form>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

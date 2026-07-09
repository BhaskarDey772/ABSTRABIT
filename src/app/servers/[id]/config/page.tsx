import { Save, SlidersHorizontal, Webhook } from 'lucide-react'
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
import { Separator } from '@/components/ui/separator'

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
        title="Server Configuration"
        description={`Manage settings and commands for ${server.guildName}`}
      />
      <div className="space-y-8 max-w-3xl">
        <Card className="border border-border/50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Webhook className="size-5 text-primary" />
              </div>
              <div>
                <CardTitle>Server Settings</CardTitle>
                <CardDescription>Configure reply channels and mirror webhooks</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form action={updateServerSettings} className="space-y-6">
              <input type="hidden" name="serverId" value={server.id} />

              <div className="space-y-2">
                <Label htmlFor="replyChannelId" className="text-sm font-semibold">Reply Channel</Label>
                <p className="text-xs text-muted-foreground mb-2">Where bot replies will be posted</p>
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

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="mirrorType" className="text-sm font-semibold">Mirror Type</Label>
                <p className="text-xs text-muted-foreground mb-2">Select where to mirror notifications</p>
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

              <div className="space-y-2">
                <Label htmlFor="mirrorWebhookUrl" className="text-sm font-semibold">Mirror Webhook URL</Label>
                <p className="text-xs text-muted-foreground mb-2">Paste your Slack or Discord webhook URL</p>
                <Input
                  key={server.mirrorWebhookUrl ?? 'none'}
                  id="mirrorWebhookUrl"
                  type="url"
                  name="mirrorWebhookUrl"
                  defaultValue={server.mirrorWebhookUrl ?? ''}
                  placeholder="https://hooks.slack.com/services/... or https://discord.com/api/webhooks/..."
                  className="font-mono text-xs"
                />
              </div>

              <SubmitButton className="gap-2 w-full sm:w-auto">
                <Save className="size-4" />
                Save Settings
              </SubmitButton>
            </form>
          </CardContent>
        </Card>

        {commands.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-accent/10">
                <SlidersHorizontal className="size-5 text-accent" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Commands</h2>
                <p className="text-sm text-muted-foreground">{commands.length} command{commands.length !== 1 ? 's' : ''} configured</p>
              </div>
            </div>
            <div className="space-y-4">
              {commands.map((c) => (
                <Card key={c.id} className="border border-border/50">
                  <CardContent className="pt-6">
                    <form action={updateCommandConfig} className="space-y-4">
                      <input type="hidden" name="serverId" value={server.id} />
                      <input type="hidden" name="commandName" value={c.commandName} />

                      <div className="flex items-center justify-between pb-4 border-b border-border/50">
                        <code className="text-sm font-semibold bg-muted/50 px-2.5 py-1.5 rounded">/{c.commandName}</code>
                        <label className="flex items-center gap-2.5 cursor-pointer">
                          <Checkbox key={String(c.enabled)} name="enabled" value="on" defaultChecked={c.enabled} />
                          <span className="text-sm font-medium">Enabled</span>
                        </label>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`responseTemplate-${c.id}`} className="text-sm font-semibold">Response Template</Label>
                        <Input
                          key={c.responseTemplate}
                          id={`responseTemplate-${c.id}`}
                          type="text"
                          name="responseTemplate"
                          defaultValue={c.responseTemplate}
                          placeholder="Enter response template"
                        />
                      </div>

                      <label className="flex items-center gap-2.5 cursor-pointer pt-2">
                        <Checkbox key={String(c.aiEnabled)} name="aiEnabled" value="on" defaultChecked={c.aiEnabled} />
                        <span className="text-sm font-medium">Enable AI tagging & summary</span>
                      </label>

                      <div className="space-y-2">
                        <Label htmlFor={`flagKeywords-${c.id}`} className="text-sm font-semibold">Flag Keywords</Label>
                        <p className="text-xs text-muted-foreground">Comma-separated, marks reports as high-priority</p>
                        <Input
                          key={c.flagKeywords.join(',')}
                          id={`flagKeywords-${c.id}`}
                          type="text"
                          name="flagKeywords"
                          defaultValue={c.flagKeywords.join(', ')}
                          placeholder="e.g. urgent, critical, spam"
                        />
                      </div>

                      <div className="pt-2">
                        <SubmitButton size="sm" className="gap-2">
                          <Save className="size-4" />
                          Save Command
                        </SubmitButton>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

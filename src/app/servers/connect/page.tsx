import { ExternalLink, Check } from 'lucide-react'
import { requireAdmin } from '@/lib/auth'
import { fetchManageableGuilds, fetchBotGuildIds } from '@/lib/discord/api'
import { buildBotInviteUrl } from '@/lib/discord/inviteUrl'
import { connectServer } from '../actions'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { SubmitButton } from '@/components/submit-button'
import { PageHeader } from '@/components/page-header'

export default async function ConnectServerPage() {
  const admin = await requireAdmin()

  if (!admin.discordAccessToken) {
    return (
      <main className="mx-auto max-w-4xl px-10 py-8">
        <p className="text-muted-foreground">Your Discord session token expired. Please sign out and sign in again.</p>
      </main>
    )
  }

  const [manageable, botGuildIds] = await Promise.all([
    fetchManageableGuilds(admin.discordAccessToken),
    fetchBotGuildIds(),
  ])

  return (
    <main className="mx-auto max-w-4xl px-10 py-8">
      <PageHeader
        title="Connect a server"
        description="Only servers where you have Manage Server permission are shown."
      />
      <div className="space-y-3">
        {manageable.map((g) => {
          const botPresent = botGuildIds.has(g.id)
          return (
            <Card key={g.id}>
              <CardHeader>
                <CardTitle className="text-base">{g.name}</CardTitle>
              </CardHeader>
              <CardContent>
                {botPresent ? (
                  <form action={connectServer}>
                    <input type="hidden" name="guildId" value={g.id} />
                    <input type="hidden" name="guildName" value={g.name} />
                    <SubmitButton size="sm" pendingText="Connecting…" className="gap-1.5">
                      <Check className="size-4" />
                      Connect
                    </SubmitButton>
                  </form>
                ) : (
                  <a
                    href={buildBotInviteUrl(g.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary underline underline-offset-4"
                  >
                    Invite the bot first
                    <ExternalLink className="size-3.5" />
                  </a>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </main>
  )
}

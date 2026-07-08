import { requireAdmin } from '@/lib/auth'
import { fetchManageableGuilds, fetchBotGuildIds } from '@/lib/discord/api'
import { buildBotInviteUrl } from '@/lib/discord/inviteUrl'
import { connectServer } from '../actions'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function ConnectServerPage() {
  const admin = await requireAdmin()

  if (!admin.discordAccessToken) {
    return (
      <main className="mx-auto max-w-xl p-8">
        <p className="text-muted-foreground">Your Discord session token expired. Please sign out and sign in again.</p>
      </main>
    )
  }

  const [manageable, botGuildIds] = await Promise.all([
    fetchManageableGuilds(admin.discordAccessToken),
    fetchBotGuildIds(),
  ])

  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="mb-2 text-xl font-semibold">Connect a server</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Only servers where you have Manage Server permission are shown.
      </p>
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
                    <Button size="sm">Connect</Button>
                  </form>
                ) : (
                  <a
                    href={buildBotInviteUrl(g.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary underline underline-offset-4"
                  >
                    Invite the bot first
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

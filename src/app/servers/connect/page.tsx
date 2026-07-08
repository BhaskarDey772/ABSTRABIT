import { requireAdmin } from '@/lib/auth'
import { fetchManageableGuilds, fetchBotGuildIds } from '@/lib/discord/api'
import { buildBotInviteUrl } from '@/lib/discord/inviteUrl'
import { connectServer } from '../actions'

export default async function ConnectServerPage() {
  const admin = await requireAdmin()

  if (!admin.discordAccessToken) {
    return (
      <main className="mx-auto max-w-xl p-8 text-neutral-100">
        <p>Your Discord session token expired. Please sign out and sign in again.</p>
      </main>
    )
  }

  const [manageable, botGuildIds] = await Promise.all([
    fetchManageableGuilds(admin.discordAccessToken),
    fetchBotGuildIds(),
  ])

  return (
    <main className="mx-auto max-w-xl p-8 text-neutral-100">
      <h1 className="mb-6 text-xl font-semibold">Connect a server</h1>
      <p className="mb-4 text-sm text-neutral-400">
        Only servers where you have Manage Server permission are shown.
      </p>
      <ul className="space-y-3">
        {manageable.map((g) => {
          const botPresent = botGuildIds.has(g.id)
          return (
            <li key={g.id} className="rounded-md border border-neutral-800 p-4">
              <div className="mb-2 font-medium">{g.name}</div>
              {botPresent ? (
                <form action={connectServer}>
                  <input type="hidden" name="guildId" value={g.id} />
                  <input type="hidden" name="guildName" value={g.name} />
                  <button className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm hover:bg-indigo-500">
                    Connect
                  </button>
                </form>
              ) : (
                <a
                  href={buildBotInviteUrl(g.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-indigo-400 underline"
                >
                  Invite the bot first
                </a>
              )}
            </li>
          )
        })}
      </ul>
    </main>
  )
}

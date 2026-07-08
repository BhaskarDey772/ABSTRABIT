const API = 'https://discord.com/api/v10'

function botHeaders() {
  return {
    Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
    'Content-Type': 'application/json',
  }
}

/** Edits the deferred response for an interaction (valid ~15 min after the interaction). */
export async function editDeferredResponse(
  interactionToken: string,
  content: string
): Promise<void> {
  const appId = process.env.DISCORD_APPLICATION_ID
  const res = await fetch(
    `${API}/webhooks/${appId}/${interactionToken}/messages/@original`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    }
  )
  if (!res.ok) {
    throw new Error(`discord followup edit failed: ${res.status} ${await res.text()}`)
  }
}

/** Posts a message directly to a channel via the bot token (used for the primary reply channel). */
export async function postChannelMessage(channelId: string, content: string): Promise<void> {
  const res = await fetch(`${API}/channels/${channelId}/messages`, {
    method: 'POST',
    headers: botHeaders(),
    body: JSON.stringify({ content }),
  })
  if (!res.ok) {
    throw new Error(`discord channel post failed: ${res.status} ${await res.text()}`)
  }
}

/** Guild ids the bot itself is currently a member of. */
export async function fetchBotGuildIds(): Promise<Set<string>> {
  const res = await fetch(`${API}/users/@me/guilds`, { headers: botHeaders() })
  if (!res.ok) throw new Error(`fetch bot guilds failed: ${res.status}`)
  const guilds = (await res.json()) as Array<{ id: string }>
  return new Set(guilds.map((g) => g.id))
}

export async function fetchGuildChannels(guildId: string) {
  const res = await fetch(`${API}/guilds/${guildId}/channels`, { headers: botHeaders() })
  if (!res.ok) throw new Error(`fetch guild channels failed: ${res.status}`)
  return (await res.json()) as Array<{ id: string; name: string; type: number }>
}

const MANAGE_GUILD = 0x20

/** Guilds where the signed-in admin has Manage Server, from their OAuth token. */
export async function fetchManageableGuilds(userAccessToken: string) {
  const res = await fetch(`${API}/users/@me/guilds`, {
    headers: { Authorization: `Bearer ${userAccessToken}` },
  })
  if (!res.ok) throw new Error(`fetch user guilds failed: ${res.status}`)
  const guilds = (await res.json()) as Array<{ id: string; name: string; permissions: string }>
  return guilds.filter((g) => (BigInt(g.permissions) & BigInt(MANAGE_GUILD)) === BigInt(MANAGE_GUILD))
}

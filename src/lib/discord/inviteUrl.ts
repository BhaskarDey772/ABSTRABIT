// View Channels (0x400) + Send Messages (0x800)
const BOT_PERMISSIONS = 0x400 | 0x800

export function buildBotInviteUrl(guildId: string): string {
  const clientId = process.env.DISCORD_APPLICATION_ID
  const params = new URLSearchParams({
    client_id: clientId ?? '',
    permissions: String(BOT_PERMISSIONS),
    scope: 'bot applications.commands',
    guild_id: guildId,
    disable_guild_select: 'true',
  })
  return `https://discord.com/oauth2/authorize?${params.toString()}`
}

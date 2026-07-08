// Registers the slash commands with Discord.
// Guild-scoped (DISCORD_DEV_GUILD_ID set) -> instant, for local/dev testing.
// Global (no guild id) -> ~1hr propagation, for production.
// Run with: npm run discord:register

const appId = process.env.DISCORD_APPLICATION_ID
const botToken = process.env.DISCORD_BOT_TOKEN
const guildId = process.env.DISCORD_DEV_GUILD_ID

if (!appId || !botToken) {
  console.error('Missing DISCORD_APPLICATION_ID or DISCORD_BOT_TOKEN in .env')
  process.exit(1)
}

const commands = [
  {
    name: 'report',
    description: 'Submit a report (opens a form)',
  },
  {
    name: 'status',
    description: 'Show recent command activity for this server',
  },
]

const url = guildId
  ? `https://discord.com/api/v10/applications/${appId}/guilds/${guildId}/commands`
  : `https://discord.com/api/v10/applications/${appId}/commands`

const res = await fetch(url, {
  method: 'PUT',
  headers: {
    Authorization: `Bot ${botToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(commands),
})

if (!res.ok) {
  console.error(`Failed: ${res.status} ${await res.text()}`)
  process.exit(1)
}

console.log(`Registered ${commands.length} commands ${guildId ? `to guild ${guildId}` : 'globally'}.`)
console.log(await res.json())

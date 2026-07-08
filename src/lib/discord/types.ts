// Named explicitly because Discord reuses the same integers across two different
// enums (e.g. 5 is both an interaction type and a response type) — comparing
// against bare numbers is how that gets mixed up.

export const InteractionType = {
  PING: 1,
  APPLICATION_COMMAND: 2,
  MESSAGE_COMPONENT: 3,
  APPLICATION_COMMAND_AUTOCOMPLETE: 4,
  MODAL_SUBMIT: 5,
} as const

export const ResponseType = {
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5,
  DEFERRED_UPDATE_MESSAGE: 6,
  UPDATE_MESSAGE: 7,
  APPLICATION_COMMAND_AUTOCOMPLETE_RESULT: 8,
  MODAL: 9,
} as const

export interface DiscordInteraction {
  id: string
  type: number
  guild_id?: string
  channel_id?: string
  token: string
  member?: { user: { id: string; username: string } }
  user?: { id: string; username: string }
  data?: {
    name?: string
    custom_id?: string
    options?: Array<{ name: string; value: string }>
    components?: Array<{ components: Array<{ custom_id: string; value: string }> }>
  }
}

export function getDiscordUserId(interaction: DiscordInteraction): string {
  const id = interaction.member?.user?.id ?? interaction.user?.id
  if (!id) throw new Error('interaction has no user id')
  return id
}

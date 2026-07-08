import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Prisma } from '@prisma/client'
import type { DiscordInteraction } from '../types'

const create = vi.fn()
const findUniqueOrThrow = vi.fn()

vi.mock('@/lib/prisma', () => ({
  prisma: {
    interaction: {
      create: (...args: unknown[]) => create(...args),
      findUniqueOrThrow: (...args: unknown[]) => findUniqueOrThrow(...args),
    },
  },
}))

const { recordOrReplay } = await import('../dedup')

const interaction: DiscordInteraction = {
  id: 'interaction-123',
  type: 2,
  guild_id: 'guild-1',
  token: 'tok',
  member: { user: { id: 'user-1', username: 'someone' } },
  data: { name: 'report' },
}

beforeEach(() => {
  create.mockReset()
  findUniqueOrThrow.mockReset()
})

describe('recordOrReplay', () => {
  it('records a new interaction on first sight', async () => {
    create.mockResolvedValue({ id: 'row-1', discordInteractionId: interaction.id })

    const result = await recordOrReplay(interaction, 'server-1')

    expect(result.isNew).toBe(true)
    expect(create).toHaveBeenCalledOnce()
    expect(findUniqueOrThrow).not.toHaveBeenCalled()
  })

  it('replays the existing row on a duplicate interaction id, without re-inserting', async () => {
    create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      })
    )
    findUniqueOrThrow.mockResolvedValue({ id: 'row-1', discordInteractionId: interaction.id, ackType: 5 })

    const result = await recordOrReplay(interaction, 'server-1')

    expect(result.isNew).toBe(false)
    expect(result.row.ackType).toBe(5)
  })

  it('rethrows unrelated database errors instead of treating them as a duplicate', async () => {
    create.mockRejectedValue(new Error('connection lost'))

    await expect(recordOrReplay(interaction, 'server-1')).rejects.toThrow('connection lost')
  })
})

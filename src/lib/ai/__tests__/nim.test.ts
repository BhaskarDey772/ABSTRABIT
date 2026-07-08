import { describe, it, expect, vi, beforeEach } from 'vitest'

const createMock = vi.fn()

vi.mock('openai', () => ({
  default: class MockOpenAI {
    chat = { completions: { create: (...args: unknown[]) => createMock(...args) } }
  },
}))

const { triageReport } = await import('../nim')

function toolCallResponse(tag: string, summary: string) {
  return {
    choices: [
      {
        message: {
          tool_calls: [{ type: 'function', function: { arguments: JSON.stringify({ tag, summary }) } }],
        },
      },
    ],
  }
}

beforeEach(() => {
  createMock.mockReset()
  process.env.NVIDIA_API_KEY_PRIMARY = 'primary-key'
  process.env.NVIDIA_MODEL_PRIMARY = 'primary-model'
  process.env.NVIDIA_API_KEY_FALLBACK = 'fallback-key'
  process.env.NVIDIA_MODEL_FALLBACK = 'fallback-model'
})

describe('triageReport', () => {
  it('uses the primary model when it succeeds, never calling the fallback', async () => {
    createMock.mockResolvedValueOnce(toolCallResponse('bug', 'a bug report'))

    const { result, failed } = await triageReport('the app crashed')

    expect(failed).toBe(false)
    expect(result).toEqual({ tag: 'bug', summary: 'a bug report' })
    expect(createMock).toHaveBeenCalledTimes(1)
  })

  it('falls back to the secondary model when the primary fails', async () => {
    createMock
      .mockRejectedValueOnce(new Error('primary timed out'))
      .mockResolvedValueOnce(toolCallResponse('feedback', 'a suggestion'))

    const { result, failed } = await triageReport('please add dark mode')

    expect(failed).toBe(false)
    expect(result).toEqual({ tag: 'feedback', summary: 'a suggestion' })
    expect(createMock).toHaveBeenCalledTimes(2)
  })

  it('reports failed with no result when both models fail, without throwing', async () => {
    createMock.mockRejectedValue(new Error('down'))

    const { result, failed } = await triageReport('anything')

    expect(failed).toBe(true)
    expect(result).toBeNull()
    expect(createMock).toHaveBeenCalledTimes(2)
  })
})

import OpenAI from 'openai'

export interface TriageResult {
  tag: string
  summary: string
}

const TRIAGE_TOOL = {
  type: 'function' as const,
  function: {
    name: 'triage',
    description: 'Tag and summarize a short report.',
    parameters: {
      type: 'object',
      properties: {
        tag: { type: 'string', description: 'One or two word category, e.g. "bug", "feedback", "spam"' },
        summary: { type: 'string', description: 'One sentence summary of the report' },
      },
      required: ['tag', 'summary'],
    },
  },
}

async function callModel(
  apiKey: string,
  model: string,
  text: string,
  timeoutMs: number
): Promise<TriageResult> {
  const client = new OpenAI({ apiKey, baseURL: 'https://integrate.api.nvidia.com/v1' })
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const completion = await client.chat.completions.create(
      {
        model,
        messages: [{ role: 'user', content: `Triage this report:\n\n${text}` }],
        tools: [TRIAGE_TOOL],
        tool_choice: { type: 'function', function: { name: 'triage' } },
        temperature: 0.2,
        max_tokens: 300,
      },
      { signal: controller.signal }
    )
    const call = completion.choices[0]?.message?.tool_calls?.[0]
    if (!call || call.type !== 'function') throw new Error('no function tool call in AI response')
    const parsed = JSON.parse(call.function.arguments) as TriageResult
    return parsed
  } finally {
    clearTimeout(timer)
  }
}

/** Tries the primary NIM model, falls back to the smaller/faster one on error or timeout. */
export async function triageReport(text: string): Promise<{ result: TriageResult | null; failed: boolean }> {
  const primaryKey = process.env.NVIDIA_API_KEY_PRIMARY
  const primaryModel = process.env.NVIDIA_MODEL_PRIMARY
  const fallbackKey = process.env.NVIDIA_API_KEY_FALLBACK
  const fallbackModel = process.env.NVIDIA_MODEL_FALLBACK

  if (primaryKey && primaryModel) {
    try {
      return { result: await callModel(primaryKey, primaryModel, text, 4000), failed: false }
    } catch {
      // fall through to fallback model
    }
  }

  if (fallbackKey && fallbackModel) {
    try {
      return { result: await callModel(fallbackKey, fallbackModel, text, 4000), failed: false }
    } catch {
      // both failed
    }
  }

  return { result: null, failed: true }
}

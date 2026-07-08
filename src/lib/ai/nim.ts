import OpenAI from 'openai'

export interface TriageResult {
  tag: string
  summary: string
}

const TRIAGE_PROMPT = (text: string) =>
  `Triage this report. Respond with ONLY a JSON object of the form ` +
  `{"tag": "<one or two word category, e.g. bug, feedback, spam>", "summary": "<one sentence summary>"} ` +
  `and no other text.\n\nReport: ${text}`

function parseTriageJson(content: string): TriageResult {
  // Reasoning models sometimes wrap the JSON in prose or a code fence despite
  // instructions — pull out the first {...} block rather than requiring an
  // exact-match response.
  const match = content.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('no JSON object in AI response')
  const parsed = JSON.parse(match[0]) as Partial<TriageResult>
  if (!parsed.tag || !parsed.summary) throw new Error('AI response missing tag/summary')
  return { tag: parsed.tag, summary: parsed.summary }
}

async function callModel(apiKey: string, model: string, text: string, timeoutMs: number): Promise<TriageResult> {
  const client = new OpenAI({ apiKey, baseURL: 'https://integrate.api.nvidia.com/v1' })
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const completion = await client.chat.completions.create(
      {
        model,
        messages: [{ role: 'user', content: TRIAGE_PROMPT(text) }],
        temperature: 0.2,
        // Generous budget: reasoning models spend tokens on hidden chain-of-thought
        // before the visible JSON, and a too-small cap truncates before that JSON
        // ever appears (observed: forced tool-calling on the same model hung
        // >20s, and a tight max_tokens produced an empty response).
        max_tokens: 500,
      },
      { signal: controller.signal }
    )
    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error('empty AI response')
    return parseTriageJson(content)
  } finally {
    clearTimeout(timer)
  }
}

/** Tries the primary NIM model, falls back to a second one on error or timeout. */
export async function triageReport(text: string): Promise<{ result: TriageResult | null; failed: boolean }> {
  const primaryKey = process.env.NVIDIA_API_KEY_PRIMARY
  const primaryModel = process.env.NVIDIA_MODEL_PRIMARY
  const fallbackKey = process.env.NVIDIA_API_KEY_FALLBACK
  const fallbackModel = process.env.NVIDIA_MODEL_FALLBACK

  if (primaryKey && primaryModel) {
    try {
      return { result: await callModel(primaryKey, primaryModel, text, 6000), failed: false }
    } catch {
      // fall through to fallback model
    }
  }

  if (fallbackKey && fallbackModel) {
    try {
      return { result: await callModel(fallbackKey, fallbackModel, text, 8000), failed: false }
    } catch {
      // both failed
    }
  }

  return { result: null, failed: true }
}

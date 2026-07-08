/** Simple rule: if the report text contains any configured keyword, it's high priority. */
export function applyFlagKeywordsRule(text: string, flagKeywords: string[]): 'high' | 'normal' {
  const lower = text.toLowerCase()
  const isFlagged = flagKeywords.some((kw) => kw.trim() && lower.includes(kw.trim().toLowerCase()))
  return isFlagged ? 'high' : 'normal'
}

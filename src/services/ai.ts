import type { AIConfig, CraftResult } from '../types'
import { SYSTEM_PROMPT } from '../utils/constants'

export async function craftElements(
  elementA: string,
  elementB: string,
  config: AIConfig,
): Promise<CraftResult | null> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)

  let lastError: Error | null = null
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `元素A: ${elementA}\n元素B: ${elementB}` },
          ],
          temperature: 0.7,
          max_tokens: 200,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content
      if (!content) throw new Error('AI 返回内容为空')

      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('无法解析 AI 返回的 JSON')

      const parsed = JSON.parse(jsonMatch[0])

      if (parsed.name === null || parsed.name === undefined) {
        return null
      }

      if (!parsed.name || !parsed.emoji || !Array.isArray(parsed.categories)) {
        throw new Error('AI 返回数据字段不完整')
      }

      return {
        name: String(parsed.name),
        emoji: String(parsed.emoji),
        categories: parsed.categories.map(String),
        reason: String(parsed.reason || ''),
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (controller.signal.aborted) break
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, (attempt + 1) * 1000))
      }
    }
  }

  clearTimeout(timeoutId)
  throw lastError || new Error('合成请求失败')
}

import { SYSTEM_PROMPT } from '../../src/utils/constants.js'
import type { AIConfig, CraftResult } from '../../src/types/index.js'
import { env } from '../config/env.js'

function extractJsonBlock(content: string): string {
  const fencedMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim()
  }

  const objectMatch = content.match(/\{[\s\S]*\}/)
  if (objectMatch?.[0]) {
    return objectMatch[0]
  }

  throw new Error('无法解析 AI 返回的 JSON')
}

export async function craftWithAi(
  elementA: string,
  elementB: string,
  config: AIConfig,
): Promise<CraftResult | null> {
  if (!env.openAiApiKey) {
    throw new Error('服务器未配置 OPENAI_API_KEY')
  }

  let lastError: Error | null = null

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs)

    try {
      const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.openAiApiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `元素A: ${elementA}\n元素B: ${elementB}` },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_tokens: 200,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`AI 请求失败: ${response.status} ${response.statusText}`)
      }

      const data = await response.json() as {
        choices?: Array<{ message?: { content?: string } }>
      }

      const content = data.choices?.[0]?.message?.content
      if (!content) {
        throw new Error('AI 返回内容为空')
      }

      const parsed = JSON.parse(extractJsonBlock(content)) as Partial<CraftResult> & { name?: string | null }

      if (parsed.name === null || parsed.name === undefined) {
        throw new Error('模型返回了空结果，已要求非违禁组合必须生成结果')
      }

      if (!parsed.name || !parsed.emoji || !Array.isArray(parsed.categories)) {
        throw new Error('AI 返回数据字段不完整')
      }

      return {
        name: String(parsed.name),
        emoji: String(parsed.emoji),
        categories: parsed.categories.map(String),
        reason: String(parsed.reason ?? ''),
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (controller.signal.aborted) {
        lastError = new Error('AI 请求超时')
      }

      if (attempt < 2) {
        await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1000))
      }
    } finally {
      clearTimeout(timeoutId)
    }
  }

  throw lastError ?? new Error('AI 合成失败')
}

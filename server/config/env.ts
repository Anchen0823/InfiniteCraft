import { resolve } from 'node:path'
import { DEFAULT_AI_CONFIG } from '../../src/utils/constants.js'
import type { AIConfig } from '../../src/types/index.js'

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback

  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }

  return parsed
}

function getDefaultAiConfig(): AIConfig {
  return {
    baseUrl: process.env.AI_BASE_URL ?? DEFAULT_AI_CONFIG.baseUrl,
    model: process.env.AI_MODEL ?? DEFAULT_AI_CONFIG.model,
    timeoutMs: parsePositiveInt(process.env.AI_TIMEOUT_MS, DEFAULT_AI_CONFIG.timeoutMs),
  }
}

export const env = {
  port: parsePositiveInt(process.env.PORT, 3001),
  databasePath: resolve(process.cwd(), process.env.DATABASE_PATH ?? '.data/infinite-craft.db'),
  openAiApiKey: process.env.OPENAI_API_KEY ?? '',
  defaultAiConfig: getDefaultAiConfig(),
}

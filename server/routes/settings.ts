import { Router } from 'express'
import type { AIConfig } from '../../src/types/index.js'
import { repository } from '../services/repository.js'

function parseSettingsUpdate(body: unknown): { aiConfig?: Partial<AIConfig>; craftCount?: number } {
  if (!body || typeof body !== 'object') {
    throw new Error('设置数据格式不正确')
  }

  const candidate = body as Record<string, unknown>
  const next: { aiConfig?: Partial<AIConfig>; craftCount?: number } = {}

  if (candidate.aiConfig !== undefined) {
    if (!candidate.aiConfig || typeof candidate.aiConfig !== 'object') {
      throw new Error('AI 配置格式不正确')
    }

    const aiConfigCandidate = candidate.aiConfig as Record<string, unknown>
    const aiConfig: Partial<AIConfig> = {}

    if (aiConfigCandidate.baseUrl !== undefined) {
      if (typeof aiConfigCandidate.baseUrl !== 'string' || !aiConfigCandidate.baseUrl.trim()) {
        throw new Error('AI Base URL 无效')
      }
      aiConfig.baseUrl = aiConfigCandidate.baseUrl.trim()
    }

    if (aiConfigCandidate.model !== undefined) {
      if (typeof aiConfigCandidate.model !== 'string' || !aiConfigCandidate.model.trim()) {
        throw new Error('模型名称无效')
      }
      aiConfig.model = aiConfigCandidate.model.trim()
    }

    if (aiConfigCandidate.timeoutMs !== undefined) {
      if (typeof aiConfigCandidate.timeoutMs !== 'number' || !Number.isFinite(aiConfigCandidate.timeoutMs)) {
        throw new Error('超时时间无效')
      }
      aiConfig.timeoutMs = Math.max(1000, Math.floor(aiConfigCandidate.timeoutMs))
    }

    next.aiConfig = aiConfig
  }

  if (candidate.craftCount !== undefined) {
    if (typeof candidate.craftCount !== 'number' || !Number.isFinite(candidate.craftCount)) {
      throw new Error('合成次数无效')
    }
    next.craftCount = Math.max(0, Math.floor(candidate.craftCount))
  }

  return next
}

export const settingsRouter = Router()

settingsRouter.get('/', (_req, res) => {
  res.json(repository.getSettings())
})

settingsRouter.put('/', (req, res) => {
  try {
    const next = parseSettingsUpdate(req.body)
    res.json(repository.updateSettings(next))
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : '设置数据无效',
    })
  }
})

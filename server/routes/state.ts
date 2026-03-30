import { Router } from 'express'
import type {
  AIConfig,
  AppStatePayload,
  Element,
  Recipe,
  WorkspaceElement,
  WorkspaceStateSnapshot,
} from '../../src/types/index.js'
import { repository } from '../services/repository.js'

function isWorkspaceItem(value: unknown): value is WorkspaceElement {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.instanceId === 'string' &&
    typeof candidate.elementId === 'string' &&
    typeof candidate.x === 'number' &&
    Number.isFinite(candidate.x) &&
    typeof candidate.y === 'number' &&
    Number.isFinite(candidate.y)
  )
}

function parseWorkspace(body: unknown): WorkspaceStateSnapshot {
  if (!body || typeof body !== 'object') {
    throw new Error('工作台数据格式不正确')
  }

  const candidate = body as Record<string, unknown>
  const items = Array.isArray(candidate.items) ? candidate.items : null

  if (!items || !items.every(isWorkspaceItem)) {
    throw new Error('工作台元素数据格式不正确')
  }

  const scale = candidate.scale
  const panX = candidate.panX
  const panY = candidate.panY

  if (
    typeof scale !== 'number' || !Number.isFinite(scale) ||
    typeof panX !== 'number' || !Number.isFinite(panX) ||
    typeof panY !== 'number' || !Number.isFinite(panY)
  ) {
    throw new Error('工作台视图数据格式不正确')
  }

  return {
    items,
    scale,
    panX,
    panY,
  }
}

function isElement(value: unknown): value is Element {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.emoji === 'string' &&
    Array.isArray(candidate.categories) &&
    candidate.categories.every(category => typeof category === 'string') &&
    typeof candidate.isBase === 'boolean' &&
    typeof candidate.discoveredAt === 'number' &&
    Number.isFinite(candidate.discoveredAt)
  )
}

function isRecipe(value: unknown): value is Recipe {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.inputA === 'string' &&
    typeof candidate.inputB === 'string' &&
    (typeof candidate.resultId === 'string' || candidate.resultId === null) &&
    typeof candidate.discoveredAt === 'number' &&
    Number.isFinite(candidate.discoveredAt)
  )
}

function isAiConfig(value: unknown): value is AIConfig {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.baseUrl === 'string' &&
    typeof candidate.model === 'string' &&
    typeof candidate.timeoutMs === 'number' &&
    Number.isFinite(candidate.timeoutMs)
  )
}

function parseAppState(body: unknown): AppStatePayload {
  if (!body || typeof body !== 'object') {
    throw new Error('导入数据格式不正确')
  }

  const candidate = body as Record<string, unknown>
  if (!Array.isArray(candidate.elements) || !candidate.elements.every(isElement)) {
    throw new Error('元素数据格式不正确')
  }

  if (!Array.isArray(candidate.recipes) || !candidate.recipes.every(isRecipe)) {
    throw new Error('配方数据格式不正确')
  }

  const workspace = parseWorkspace(candidate.workspace)
  const settings = candidate.settings
  if (!settings || typeof settings !== 'object') {
    throw new Error('设置数据格式不正确')
  }

  const settingsCandidate = settings as Record<string, unknown>
  if (
    !isAiConfig(settingsCandidate.aiConfig) ||
    typeof settingsCandidate.craftCount !== 'number' ||
    !Number.isFinite(settingsCandidate.craftCount) ||
    (settingsCandidate.audioEnabled !== undefined && typeof settingsCandidate.audioEnabled !== 'boolean')
  ) {
    throw new Error('设置数据格式不正确')
  }

  return {
    elements: candidate.elements,
    recipes: candidate.recipes,
    workspace,
    settings: {
      aiConfig: settingsCandidate.aiConfig,
      craftCount: Math.max(0, Math.floor(settingsCandidate.craftCount)),
      hasApiKey: false,
      audioEnabled: settingsCandidate.audioEnabled ?? true,
    },
  }
}

export const stateRouter = Router()

stateRouter.get('/', (_req, res) => {
  res.json(repository.getAppState())
})

stateRouter.put('/workspace', (req, res) => {
  try {
    const workspace = parseWorkspace(req.body)
    repository.replaceWorkspace(workspace)
    res.status(204).end()
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : '工作台数据无效',
    })
  }
})

stateRouter.post('/import', (req, res) => {
  try {
    const importedState = parseAppState(req.body)
    res.json(repository.replaceAppState(importedState))
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : '导入数据无效',
    })
  }
})

stateRouter.post('/reset', (_req, res) => {
  res.json(repository.resetProgress())
})

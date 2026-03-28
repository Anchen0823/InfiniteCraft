import { Router } from 'express'
import type { WorkspaceElement, WorkspaceStateSnapshot } from '../../src/types/index.js'
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

export interface Element {
  id: string
  name: string
  emoji: string
  categories: string[]
  isBase: boolean
  discoveredAt: number
}

export interface Recipe {
  id: string
  inputA: string
  inputB: string
  resultId: string | null
  discoveredAt: number
}

export interface WorkspaceElement {
  instanceId: string
  elementId: string
  x: number
  y: number
}

export interface AIConfig {
  baseUrl: string
  model: string
  timeoutMs: number
}

export interface CraftResult {
  name: string
  emoji: string
  categories: string[]
  reason: string
}

export interface WorkspaceStateSnapshot {
  items: WorkspaceElement[]
  scale: number
  panX: number
  panY: number
}

export interface SettingsPayload {
  aiConfig: AIConfig
  craftCount: number
  hasApiKey: boolean
}

export interface AppStatePayload {
  elements: Element[]
  recipes: Recipe[]
  workspace: WorkspaceStateSnapshot
  settings: SettingsPayload
}

export interface CraftResponse {
  recipe: Recipe
  resultElement: Element | null
  craftCount: number
}

export interface CraftAnimationItem {
  instanceId: string
  emoji: string
  name: string
  x: number
  y: number
}

export interface CraftAnimationState {
  id: string
  phase: 'crafting' | 'success' | 'failed'
  itemA: CraftAnimationItem
  itemB: CraftAnimationItem
  centerX: number
  centerY: number
  result?: {
    emoji: string
    name: string
  }
  isNewDiscovery?: boolean
}

export interface CraftNotice {
  id: string
  type: 'success' | 'error'
  message: string
}

export interface CraftTreeNodeData extends Record<string, unknown> {
  elementId: string
  emoji: string
  name: string
  categories: string[]
  isBase: boolean
  depth: number
  sourceCount: number
}

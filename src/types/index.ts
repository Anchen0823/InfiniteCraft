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
  apiKey: string
  baseUrl: string
  model: string
}

export interface CraftResult {
  name: string
  emoji: string
  categories: string[]
  reason: string
}

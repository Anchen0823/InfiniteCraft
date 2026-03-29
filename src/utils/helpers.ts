import dagre from 'dagre'
import { Position, type Edge, type Node } from '@xyflow/react'
import type { CraftTreeNodeData, Element, Recipe } from '../types'

export function normalizeRecipeKey(a: string, b: string): string {
  return [a, b].sort().join('+')
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function screenToCanvas(
  screenX: number,
  screenY: number,
  pan: { x: number; y: number },
  scale: number,
) {
  return {
    x: (screenX - pan.x) / scale,
    y: (screenY - pan.y) / scale,
  }
}

export function checkOverlap(rectA: DOMRect, rectB: DOMRect): boolean {
  const overlapX = Math.max(0, Math.min(rectA.right, rectB.right) - Math.max(rectA.left, rectB.left))
  const overlapY = Math.max(0, Math.min(rectA.bottom, rectB.bottom) - Math.max(rectA.top, rectB.top))
  const overlapArea = overlapX * overlapY
  const minArea = Math.min(rectA.width * rectA.height, rectB.width * rectB.height)
  return overlapArea > minArea * 0.3
}

const NODE_WIDTH = 144
const NODE_HEIGHT = 60
const LAYER_GAP_Y = 132
const LAYER_GAP_X = 196

type CraftTreeEdge = Edge<{ isPrimary: boolean }>
type ResolvedRecipe = {
  recipe: Recipe
  targetId: string
  sourceAId: string
  sourceBId: string
}

export function buildTreeData(
  elements: Element[],
  recipes: Recipe[],
): {
  nodes: Node<CraftTreeNodeData>[]
  edges: CraftTreeEdge[]
} {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({
    rankdir: 'TB',
    nodesep: 32,
    ranksep: 96,
    marginx: 24,
    marginy: 24,
  })

  const elementIdByName = new Map(elements.map(element => [element.name, element.id]))
  const recipesByResult = new Map<string, ResolvedRecipe[]>()

  for (const recipe of recipes) {
    const targetId = recipe.resultId
    if (!targetId) continue

    const sourceAId = elementIdByName.get(recipe.inputA)
    const sourceBId = elementIdByName.get(recipe.inputB)
    if (!sourceAId || !sourceBId) continue

    const resolvedRecipe: ResolvedRecipe = {
      recipe,
      targetId,
      sourceAId,
      sourceBId,
    }

    const bucket = recipesByResult.get(targetId) ?? []
    bucket.push(resolvedRecipe)
    recipesByResult.set(targetId, bucket)
  }

  const depthById = new Map<string, number>()
  for (const element of elements) {
    depthById.set(element.id, element.isBase ? 0 : Number.POSITIVE_INFINITY)
  }

  for (let i = 0; i < elements.length; i += 1) {
    let updated = false

    for (const [resultId, resolvedRecipes] of recipesByResult.entries()) {
      let bestDepth = depthById.get(resultId) ?? Number.POSITIVE_INFINITY

      for (const { sourceAId, sourceBId } of resolvedRecipes) {
        const sourceADepth = depthById.get(sourceAId) ?? Number.POSITIVE_INFINITY
        const sourceBDepth = depthById.get(sourceBId) ?? Number.POSITIVE_INFINITY
        if (!Number.isFinite(sourceADepth) || !Number.isFinite(sourceBDepth)) continue

        const candidateDepth = Math.max(sourceADepth, sourceBDepth) + 1
        if (candidateDepth < bestDepth) {
          bestDepth = candidateDepth
        }
      }

      if (bestDepth < (depthById.get(resultId) ?? Number.POSITIVE_INFINITY)) {
        depthById.set(resultId, bestDepth)
        updated = true
      }
    }

    if (!updated) break
  }

  const fallbackDepth = Math.max(0, ...Array.from(depthById.values()).filter(Number.isFinite))
  for (const element of elements) {
    if (!Number.isFinite(depthById.get(element.id) ?? Number.POSITIVE_INFINITY)) {
      depthById.set(element.id, fallbackDepth + 1)
    }
  }

  const primaryRecipeIds = new Set<string>()
  for (const [resultId, resolvedRecipes] of recipesByResult.entries()) {
    const targetDepth = depthById.get(resultId) ?? fallbackDepth + 1
    const sorted = [...resolvedRecipes].sort((left, right) => {
      const leftDepth = Math.max(
        depthById.get(left.sourceAId) ?? Number.POSITIVE_INFINITY,
        depthById.get(left.sourceBId) ?? Number.POSITIVE_INFINITY,
      )
      const rightDepth = Math.max(
        depthById.get(right.sourceAId) ?? Number.POSITIVE_INFINITY,
        depthById.get(right.sourceBId) ?? Number.POSITIVE_INFINITY,
      )

      const leftScore = Math.abs(targetDepth - (leftDepth + 1))
      const rightScore = Math.abs(targetDepth - (rightDepth + 1))
      if (leftScore !== rightScore) return leftScore - rightScore
      if (leftDepth !== rightDepth) return leftDepth - rightDepth
      return left.recipe.discoveredAt - right.recipe.discoveredAt
    })

    if (sorted[0]) {
      primaryRecipeIds.add(sorted[0].recipe.id)
    }
  }

  const nodes: Node<CraftTreeNodeData>[] = elements.map(element => {
    dagreGraph.setNode(element.id, { width: NODE_WIDTH, height: NODE_HEIGHT })

    return {
      id: element.id,
      type: 'default',
      position: { x: 0, y: 0 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      data: {
        elementId: element.id,
        emoji: element.emoji,
        name: element.name,
        categories: element.categories,
        isBase: element.isBase,
        depth: depthById.get(element.id) ?? 0,
        sourceCount: recipesByResult.get(element.id)?.length ?? 0,
      },
    }
  })

  const edges: CraftTreeEdge[] = []

  for (const resolvedRecipes of recipesByResult.values()) {
    for (const { recipe, targetId, sourceAId, sourceBId } of resolvedRecipes) {
      dagreGraph.setEdge(sourceAId, targetId)
      dagreGraph.setEdge(sourceBId, targetId)

      const isPrimary = primaryRecipeIds.has(recipe.id)
      edges.push(
        {
          id: `${recipe.id}-a`,
          source: sourceAId,
          target: targetId,
          animated: false,
          type: 'smoothstep',
          data: { isPrimary },
        },
        {
          id: `${recipe.id}-b`,
          source: sourceBId,
          target: targetId,
          animated: false,
          type: 'smoothstep',
          data: { isPrimary },
        },
      )
    }
  }

  dagre.layout(dagreGraph)

  const graphXById = new Map<string, number>(
    nodes.map(node => [node.id, dagreGraph.node(node.id)?.x ?? 0]),
  )

  const nodesByDepth = new Map<number, Node<CraftTreeNodeData>[]>()
  for (const node of nodes) {
    const bucket = nodesByDepth.get(node.data.depth) ?? []
    bucket.push(node)
    nodesByDepth.set(node.data.depth, bucket)
  }

  const maxLayerSize = Math.max(1, ...Array.from(nodesByDepth.values()).map(layer => layer.length))
  const maxLayerWidth = (maxLayerSize - 1) * LAYER_GAP_X

  const layoutedNodes = Array.from(nodesByDepth.entries())
    .sort(([leftDepth], [rightDepth]) => leftDepth - rightDepth)
    .flatMap(([depth, layerNodes]) => {
      const sortedLayer = [...layerNodes].sort(
        (left, right) => (graphXById.get(left.id) ?? 0) - (graphXById.get(right.id) ?? 0),
      )

      const layerWidth = (sortedLayer.length - 1) * LAYER_GAP_X
      const startX = (maxLayerWidth - layerWidth) / 2

      return sortedLayer.map((node, index) => ({
        ...node,
        position: {
          x: startX + index * LAYER_GAP_X,
          y: depth * LAYER_GAP_Y,
        },
      }))
    })

  return {
    nodes: layoutedNodes,
    edges,
  }
}

import { useCallback, useState } from 'react'
import { useWorkspaceStore } from '../store/workspaceStore'
import { useElementStore } from '../store/elementStore'
import { useRecipeStore } from '../store/recipeStore'
import { useSettingsStore } from '../store/settingsStore'
import { generateId } from '../utils/helpers'
import type { WorkspaceElement } from '../types'

interface CraftState {
  crafting: boolean
  craftingIds: [string, string] | null
}

export function useCraft() {
  const [state, setState] = useState<CraftState>({ crafting: false, craftingIds: null })
  const { removeItem, addItem } = useWorkspaceStore()
  const { getElement, addElement } = useElementStore()
  const { findRecipe, addRecipe } = useRecipeStore()
  const { incrementCraftCount } = useSettingsStore()

  const craft = useCallback(
    async (itemA: WorkspaceElement, itemB: WorkspaceElement) => {
      const elA = getElement(itemA.elementId)
      const elB = getElement(itemB.elementId)
      if (!elA || !elB) return

      setState({ crafting: true, craftingIds: [itemA.instanceId, itemB.instanceId] })

      const midX = (itemA.x + itemB.x) / 2
      const midY = (itemA.y + itemB.y) / 2

      const cached = findRecipe(elA.name, elB.name)
      if (cached) {
        removeItem(itemA.instanceId)
        removeItem(itemB.instanceId)

        if (cached.resultId) {
          addItem({
            instanceId: generateId(),
            elementId: cached.resultId,
            x: midX,
            y: midY,
          })
        } else {
          addItem({ ...itemA, instanceId: generateId() })
          addItem({ ...itemB, instanceId: generateId() })
        }
        incrementCraftCount()
        setState({ crafting: false, craftingIds: null })
        return
      }

      const { aiConfig } = useSettingsStore.getState()
      if (!aiConfig.apiKey) {
        alert('请先在设置中配置 AI API Key 后再进行合成')
        setState({ crafting: false, craftingIds: null })
        return
      }

      try {
        const { craftElements } = await import('../services/ai')
        const result = await craftElements(elA.name, elB.name, aiConfig)

        removeItem(itemA.instanceId)
        removeItem(itemB.instanceId)

        if (result) {
          const existing = useElementStore.getState().getAllElements().find(e => e.name === result.name)
          let resultId: string

          if (existing) {
            resultId = existing.id
          } else {
            resultId = generateId()
            addElement({
              id: resultId,
              name: result.name,
              emoji: result.emoji,
              categories: result.categories,
              isBase: false,
              discoveredAt: Date.now(),
            })
          }

          addRecipe({
            id: generateId(),
            inputA: elA.name,
            inputB: elB.name,
            resultId,
            discoveredAt: Date.now(),
          })

          addItem({
            instanceId: generateId(),
            elementId: resultId,
            x: midX,
            y: midY,
          })
        } else {
          addRecipe({
            id: generateId(),
            inputA: elA.name,
            inputB: elB.name,
            resultId: null,
            discoveredAt: Date.now(),
          })

          addItem({ ...itemA, instanceId: generateId() })
          addItem({ ...itemB, instanceId: generateId() })
        }

        incrementCraftCount()
      } catch (err) {
        console.error('合成失败:', err)
        alert(`合成失败: ${err instanceof Error ? err.message : '未知错误'}`)
      } finally {
        setState({ crafting: false, craftingIds: null })
      }
    },
    [getElement, findRecipe, removeItem, addItem, addElement, addRecipe, incrementCraftCount],
  )

  return { craft, crafting: state.crafting, craftingIds: state.craftingIds }
}

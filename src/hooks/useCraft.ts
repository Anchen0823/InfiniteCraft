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
        }
        incrementCraftCount()
        setState({ crafting: false, craftingIds: null })
        return
      }

      // Mock: simulate AI delay, will be replaced in Phase 5/6
      await new Promise(r => setTimeout(r, 800))

      const mockResults: Record<string, { name: string; emoji: string; categories: string[] }> = {
        '水+火': { name: '蒸汽', emoji: '♨️', categories: ['自然', '天气'] },
        '火+水': { name: '蒸汽', emoji: '♨️', categories: ['自然', '天气'] },
        '火+土': { name: '岩浆', emoji: '🌋', categories: ['自然', '地理'] },
        '土+火': { name: '岩浆', emoji: '🌋', categories: ['自然', '地理'] },
        '水+土': { name: '泥巴', emoji: '💩', categories: ['自然'] },
        '土+水': { name: '泥巴', emoji: '💩', categories: ['自然'] },
        '金+火': { name: '熔金', emoji: '✨', categories: ['矿物', '工具'] },
        '火+金': { name: '熔金', emoji: '✨', categories: ['矿物', '工具'] },
        '木+火': { name: '炭', emoji: '⬛', categories: ['自然', '化学'] },
        '火+木': { name: '炭', emoji: '⬛', categories: ['自然', '化学'] },
        '水+木': { name: '树苗', emoji: '🌱', categories: ['植物'] },
        '木+水': { name: '树苗', emoji: '🌱', categories: ['植物'] },
        '金+木': { name: '斧头', emoji: '🪓', categories: ['工具'] },
        '木+金': { name: '斧头', emoji: '🪓', categories: ['工具'] },
        '金+土': { name: '矿石', emoji: '⛏️', categories: ['矿物'] },
        '土+金': { name: '矿石', emoji: '⛏️', categories: ['矿物'] },
        '金+水': { name: '镜子', emoji: '🪞', categories: ['工具'] },
        '水+金': { name: '镜子', emoji: '🪞', categories: ['工具'] },
        '木+土': { name: '农田', emoji: '🌾', categories: ['自然', '植物'] },
        '土+木': { name: '农田', emoji: '🌾', categories: ['自然', '植物'] },
      }

      const key = `${elA.name}+${elB.name}`
      const mockResult = mockResults[key]

      removeItem(itemA.instanceId)
      removeItem(itemB.instanceId)

      if (mockResult) {
        const existingEl = useElementStore.getState().getAllElements().find(e => e.name === mockResult.name)
        let resultId: string

        if (existingEl) {
          resultId = existingEl.id
        } else {
          resultId = generateId()
          addElement({
            id: resultId,
            name: mockResult.name,
            emoji: mockResult.emoji,
            categories: mockResult.categories,
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
      setState({ crafting: false, craftingIds: null })
    },
    [getElement, findRecipe, removeItem, addItem, addElement, addRecipe, incrementCraftCount],
  )

  return { craft, crafting: state.crafting, craftingIds: state.craftingIds }
}

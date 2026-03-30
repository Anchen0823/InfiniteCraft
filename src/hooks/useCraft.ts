import { useCallback, useEffect, useRef, useState } from 'react'
import { useWorkspaceStore } from '../store/workspaceStore'
import { useElementStore } from '../store/elementStore'
import { useRecipeStore } from '../store/recipeStore'
import { useSettingsStore } from '../store/settingsStore'
import { generateId } from '../utils/helpers'
import { playCraftSuccessSound, playNewDiscoverySound } from '../utils/sound'
import type {
  CraftAnimationState,
  CraftNotice,
  WorkspaceElement,
} from '../types'

interface CraftState {
  crafting: boolean
  craftingIds: [string, string] | null
  animation: CraftAnimationState | null
  notice: CraftNotice | null
}

const CRAFTING_ANIMATION_MS = 500
const RESULT_ANIMATION_MS = 1200
const NOTICE_DURATION_MS = 2600

function delay(ms: number) {
  return new Promise(resolve => window.setTimeout(resolve, ms))
}

export function useCraft() {
  const [state, setState] = useState<CraftState>({
    crafting: false,
    craftingIds: null,
    animation: null,
    notice: null,
  })
  const { removeItem, addItem } = useWorkspaceStore()
  const { getElement, addElement, findByName } = useElementStore()
  const { findRecipe, addRecipe } = useRecipeStore()
  const { incrementCraftCount, setCraftCount, hasApiKey, audioEnabled } = useSettingsStore()
  const animationTimeoutRef = useRef<number | null>(null)
  const noticeTimeoutRef = useRef<number | null>(null)

  const clearAnimationTimeout = useCallback(() => {
    if (animationTimeoutRef.current !== null) {
      window.clearTimeout(animationTimeoutRef.current)
      animationTimeoutRef.current = null
    }
  }, [])

  const clearNoticeTimeout = useCallback(() => {
    if (noticeTimeoutRef.current !== null) {
      window.clearTimeout(noticeTimeoutRef.current)
      noticeTimeoutRef.current = null
    }
  }, [])

  const setNotice = useCallback((notice: CraftNotice | null) => {
    clearNoticeTimeout()
    setState(prev => ({ ...prev, notice }))

    if (!notice) return

    noticeTimeoutRef.current = window.setTimeout(() => {
      setState(prev => ({ ...prev, notice: null }))
      noticeTimeoutRef.current = null
    }, NOTICE_DURATION_MS)
  }, [clearNoticeTimeout])

  const setAnimation = useCallback((animation: CraftAnimationState | null, autoClearMs?: number) => {
    clearAnimationTimeout()
    setState(prev => ({ ...prev, animation }))

    if (!animation || !autoClearMs) return

    animationTimeoutRef.current = window.setTimeout(() => {
      setState(prev => ({ ...prev, animation: null }))
      animationTimeoutRef.current = null
    }, autoClearMs)
  }, [clearAnimationTimeout])

  useEffect(() => {
    return () => {
      clearAnimationTimeout()
      clearNoticeTimeout()
    }
  }, [clearAnimationTimeout, clearNoticeTimeout])

  const craft = useCallback(
    async (itemA: WorkspaceElement, itemB: WorkspaceElement) => {
      const elA = getElement(itemA.elementId)
      const elB = getElement(itemB.elementId)
      if (!elA || !elB) return

      const midX = (itemA.x + itemB.x) / 2
      const midY = (itemA.y + itemB.y) / 2
      const startedAt = Date.now()
      const animationBase: CraftAnimationState = {
        id: generateId(),
        phase: 'crafting',
        itemA: {
          instanceId: itemA.instanceId,
          emoji: elA.emoji,
          name: elA.name,
          x: itemA.x,
          y: itemA.y,
        },
        itemB: {
          instanceId: itemB.instanceId,
          emoji: elB.emoji,
          name: elB.name,
          x: itemB.x,
          y: itemB.y,
        },
        centerX: midX,
        centerY: midY,
      }

      setState(prev => ({
        ...prev,
        crafting: true,
        craftingIds: [itemA.instanceId, itemB.instanceId],
      }))
      setAnimation(animationBase)

      const waitForCraftingAnimation = async () => {
        const elapsed = Date.now() - startedAt
        if (elapsed < CRAFTING_ANIMATION_MS) {
          await delay(CRAFTING_ANIMATION_MS - elapsed)
        }
      }

      const cached = findRecipe(elA.name, elB.name)
      if (cached) {
        await waitForCraftingAnimation()

        removeItem(itemA.instanceId)
        removeItem(itemB.instanceId)

        if (cached.resultId) {
          const cachedResult = getElement(cached.resultId)

          addItem({
            instanceId: generateId(),
            elementId: cached.resultId,
            x: midX,
            y: midY,
          })

          setAnimation({
            ...animationBase,
            phase: 'success',
            result: cachedResult
              ? { emoji: cachedResult.emoji, name: cachedResult.name }
              : undefined,
            isNewDiscovery: false,
          }, RESULT_ANIMATION_MS)
          if (audioEnabled) {
            playCraftSuccessSound()
          }
        } else {
          addItem({ ...itemA, instanceId: generateId() })
          addItem({ ...itemB, instanceId: generateId() })
          setAnimation({
            ...animationBase,
            phase: 'failed',
          }, RESULT_ANIMATION_MS)
          setNotice({
            id: generateId(),
            type: 'error',
            message: '这两种元素无法合成',
          })
        }

        incrementCraftCount()
        setState(prev => ({ ...prev, crafting: false, craftingIds: null }))
        return
      }

      if (!hasApiKey) {
        setNotice({
          id: generateId(),
          type: 'error',
          message: '服务器未配置 OPENAI_API_KEY，暂时无法进行新的 AI 合成',
        })
        setAnimation({
          ...animationBase,
          phase: 'failed',
        }, RESULT_ANIMATION_MS)
        setState(prev => ({ ...prev, crafting: false, craftingIds: null }))
        return
      }

      try {
        const { craftElements } = await import('../services/ai')
        const result = await craftElements(elA.name, elB.name)
        await waitForCraftingAnimation()

        removeItem(itemA.instanceId)
        removeItem(itemB.instanceId)

        addRecipe(result.recipe)
        setCraftCount(result.craftCount)

        if (result.resultElement) {
          const existing = findByName(result.resultElement.name)
          const resultId = existing?.id ?? result.resultElement.id
          const isNewDiscovery = !existing

          if (!existing) {
            addElement(result.resultElement)
          }

          addItem({
            instanceId: generateId(),
            elementId: resultId,
            x: midX,
            y: midY,
          })

          setAnimation({
            ...animationBase,
            phase: 'success',
            result: {
              emoji: result.resultElement.emoji,
              name: result.resultElement.name,
            },
            isNewDiscovery,
          }, RESULT_ANIMATION_MS)

          if (isNewDiscovery) {
            if (audioEnabled) {
              playNewDiscoverySound()
            }
            setNotice({
              id: generateId(),
              type: 'success',
              message: `发现新元素：${result.resultElement.emoji} ${result.resultElement.name}`,
            })
          } else {
            if (audioEnabled) {
              playCraftSuccessSound()
            }
          }
        } else {
          addItem({ ...itemA, instanceId: generateId() })
          addItem({ ...itemB, instanceId: generateId() })

          setAnimation({
            ...animationBase,
            phase: 'failed',
          }, RESULT_ANIMATION_MS)
          setNotice({
            id: generateId(),
            type: 'error',
            message: '这两种元素无法合成',
          })
        }
      } catch (err) {
        await waitForCraftingAnimation()
        console.error('合成失败:', err)
        setAnimation({
          ...animationBase,
          phase: 'failed',
        }, RESULT_ANIMATION_MS)
        setNotice({
          id: generateId(),
          type: 'error',
          message: err instanceof Error ? err.message : '合成失败，请稍后重试',
        })
      } finally {
        setState(prev => ({ ...prev, crafting: false, craftingIds: null }))
      }
    },
    [
      getElement,
      findRecipe,
      removeItem,
      addItem,
      addElement,
      addRecipe,
      incrementCraftCount,
      setCraftCount,
      hasApiKey,
      audioEnabled,
      findByName,
      setAnimation,
      setNotice,
    ],
  )

  return {
    craft,
    crafting: state.crafting,
    craftingIds: state.craftingIds,
    animation: state.animation,
    notice: state.notice,
  }
}

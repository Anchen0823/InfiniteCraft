import { create } from 'zustand'
import type { AIConfig, SettingsPayload } from '../types'
import { DEFAULT_AI_CONFIG } from '../utils/constants'

interface SettingsState {
  aiConfig: AIConfig
  craftCount: number
  hasApiKey: boolean
  replaceAll: (settings: SettingsPayload) => void
  updateConfig: (config: Partial<AIConfig>) => void
  setCraftCount: (craftCount: number) => void
  setHasApiKey: (hasApiKey: boolean) => void
  incrementCraftCount: () => void
}

export const useSettingsStore = create<SettingsState>()(
  (set) => ({
    aiConfig: { ...DEFAULT_AI_CONFIG },
    craftCount: 0,
    hasApiKey: false,

    replaceAll: (settings: SettingsPayload) => {
      set({
        aiConfig: settings.aiConfig,
        craftCount: settings.craftCount,
        hasApiKey: settings.hasApiKey,
      })
    },

    updateConfig: (config: Partial<AIConfig>) => {
      set(state => ({
        aiConfig: { ...state.aiConfig, ...config },
      }))
    },

    setCraftCount: (craftCount: number) => {
      set({ craftCount })
    },

    setHasApiKey: (hasApiKey: boolean) => {
      set({ hasApiKey })
    },

    incrementCraftCount: () => {
      set(state => ({ craftCount: state.craftCount + 1 }))
    },
  }),
)

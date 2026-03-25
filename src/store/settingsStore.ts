import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AIConfig } from '../types'
import { DEFAULT_AI_CONFIG } from '../utils/constants'

interface SettingsState {
  aiConfig: AIConfig
  craftCount: number
  updateConfig: (config: Partial<AIConfig>) => void
  incrementCraftCount: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      aiConfig: { ...DEFAULT_AI_CONFIG },
      craftCount: 0,

      updateConfig: (config: Partial<AIConfig>) => {
        set(state => ({
          aiConfig: { ...state.aiConfig, ...config },
        }))
      },

      incrementCraftCount: () => {
        set(state => ({ craftCount: state.craftCount + 1 }))
      },
    }),
    {
      name: 'infinite-craft-settings',
    },
  ),
)

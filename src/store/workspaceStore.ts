import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WorkspaceElement } from '../types'

interface WorkspaceState {
  items: WorkspaceElement[]
  scale: number
  panX: number
  panY: number
  addItem: (item: WorkspaceElement) => void
  removeItem: (instanceId: string) => void
  moveItem: (instanceId: string, x: number, y: number) => void
  clearAll: () => void
  setScale: (scale: number) => void
  setPan: (x: number, y: number) => void
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      items: [],
      scale: 1,
      panX: 0,
      panY: 0,

      addItem: (item: WorkspaceElement) => {
        set(state => ({ items: [...state.items, item] }))
      },

      removeItem: (instanceId: string) => {
        set(state => ({
          items: state.items.filter(i => i.instanceId !== instanceId),
        }))
      },

      moveItem: (instanceId: string, x: number, y: number) => {
        set(state => ({
          items: state.items.map(i =>
            i.instanceId === instanceId ? { ...i, x, y } : i,
          ),
        }))
      },

      clearAll: () => {
        set({ items: [] })
      },

      setScale: (scale: number) => {
        set({ scale: Math.min(2, Math.max(0.25, scale)) })
      },

      setPan: (x: number, y: number) => {
        set({ panX: x, panY: y })
      },
    }),
    {
      name: 'infinite-craft-workspace',
    },
  ),
)

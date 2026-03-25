import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Element } from '../types'
import { BASE_ELEMENTS } from '../utils/constants'

interface ElementState {
  elements: Record<string, Element>
  addElement: (element: Element) => boolean
  getElement: (id: string) => Element | undefined
  getAllElements: () => Element[]
  searchElements: (query: string) => Element[]
  findByName: (name: string) => Element | undefined
}

const initialElements: Record<string, Element> = {}
for (const el of BASE_ELEMENTS) {
  initialElements[el.id] = el
}

export const useElementStore = create<ElementState>()(
  persist(
    (set, get) => ({
      elements: initialElements,

      addElement: (element: Element) => {
        const existing = Object.values(get().elements).find(e => e.name === element.name)
        if (existing) return false
        set(state => ({
          elements: { ...state.elements, [element.id]: element },
        }))
        return true
      },

      getElement: (id: string) => {
        return get().elements[id]
      },

      getAllElements: () => {
        return Object.values(get().elements)
      },

      searchElements: (query: string) => {
        const q = query.toLowerCase()
        return Object.values(get().elements).filter(
          e => e.name.toLowerCase().includes(q) || e.categories.some(c => c.toLowerCase().includes(q)),
        )
      },

      findByName: (name: string) => {
        return Object.values(get().elements).find(e => e.name === name)
      },
    }),
    {
      name: 'infinite-craft-elements',
    },
  ),
)

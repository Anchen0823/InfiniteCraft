import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Recipe } from '../types'
import { normalizeRecipeKey } from '../utils/helpers'

interface RecipeState {
  recipes: Recipe[]
  recipeIndex: Record<string, Recipe>
  addRecipe: (recipe: Recipe) => void
  findRecipe: (nameA: string, nameB: string) => Recipe | undefined
  getRecipesForElement: (elementId: string) => Recipe[]
}

export const useRecipeStore = create<RecipeState>()(
  persist(
    (set, get) => ({
      recipes: [],
      recipeIndex: {},

      addRecipe: (recipe: Recipe) => {
        const key = normalizeRecipeKey(recipe.inputA, recipe.inputB)
        if (get().recipeIndex[key]) return
        set(state => ({
          recipes: [...state.recipes, recipe],
          recipeIndex: { ...state.recipeIndex, [key]: recipe },
        }))
      },

      findRecipe: (nameA: string, nameB: string) => {
        const key = normalizeRecipeKey(nameA, nameB)
        return get().recipeIndex[key]
      },

      getRecipesForElement: (elementId: string) => {
        return get().recipes.filter(
          r => r.resultId === elementId || r.inputA === elementId || r.inputB === elementId,
        )
      },
    }),
    {
      name: 'infinite-craft-recipes',
    },
  ),
)

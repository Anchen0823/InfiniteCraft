import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import type { CraftResponse, Element, Recipe } from '../../src/types/index.js'
import { craftWithAi } from '../services/ai.js'
import { repository } from '../services/repository.js'

function parseCraftInput(body: unknown): { elementA: string; elementB: string } {
  if (!body || typeof body !== 'object') {
    throw new Error('请求体格式不正确')
  }

  const candidate = body as Record<string, unknown>
  if (typeof candidate.elementA !== 'string' || typeof candidate.elementB !== 'string') {
    throw new Error('元素参数缺失')
  }

  const elementA = candidate.elementA.trim()
  const elementB = candidate.elementB.trim()

  if (!elementA || !elementB) {
    throw new Error('元素名称不能为空')
  }

  return { elementA, elementB }
}

function buildRecipe(elementA: string, elementB: string, resultId: string | null): Recipe {
  return {
    id: randomUUID(),
    inputA: elementA,
    inputB: elementB,
    resultId,
    discoveredAt: Date.now(),
  }
}

export const craftRouter = Router()

craftRouter.post('/', async (req, res) => {
  try {
    const { elementA, elementB } = parseCraftInput(req.body)

    const cachedRecipe = repository.findRecipe(elementA, elementB)
    if (cachedRecipe) {
      const response: CraftResponse = {
        recipe: cachedRecipe,
        resultElement: cachedRecipe.resultId ? repository.getElementById(cachedRecipe.resultId) ?? null : null,
        craftCount: repository.incrementCraftCount(),
      }

      res.json(response)
      return
    }

    const settings = repository.getSettings()
    const aiResult = await craftWithAi(elementA, elementB, settings.aiConfig)

    let resultElement: Element | null = null
    if (aiResult) {
      resultElement = repository.findElementByName(aiResult.name) ?? null

      if (!resultElement) {
        resultElement = {
          id: randomUUID(),
          name: aiResult.name,
          emoji: aiResult.emoji,
          categories: aiResult.categories,
          isBase: false,
          discoveredAt: Date.now(),
        }

        repository.insertElement(resultElement)
      }
    }

    const recipe = buildRecipe(elementA, elementB, resultElement?.id ?? null)
    repository.insertRecipe(recipe)

    const response: CraftResponse = {
      recipe,
      resultElement,
      craftCount: repository.incrementCraftCount(),
    }

    res.json(response)
  } catch (error) {
    const message = error instanceof Error ? error.message : '合成失败'
    const status = message.includes('OPENAI_API_KEY') ? 503 : 400

    res.status(status).json({ message })
  }
})

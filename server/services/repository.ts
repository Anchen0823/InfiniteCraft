import type { Database } from 'better-sqlite3'
import {
  BASE_ELEMENTS,
  DEFAULT_AI_CONFIG,
} from '../../src/utils/constants.js'
import type {
  AIConfig,
  AppStatePayload,
  Element,
  Recipe,
  SettingsPayload,
  WorkspaceElement,
  WorkspaceStateSnapshot,
} from '../../src/types/index.js'
import { db } from '../db/client.js'
import { env } from '../config/env.js'

type ElementRow = {
  id: string
  name: string
  emoji: string
  categories: string
  is_base: number
  discovered_at: number
}

type RecipeRow = {
  id: string
  input_a: string
  input_b: string
  result_id: string | null
  discovered_at: number
}

type WorkspaceRow = {
  instance_id: string
  element_id: string
  x: number
  y: number
}

type SettingRow = {
  value: string
}

function mapElement(row: ElementRow): Element {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    categories: JSON.parse(row.categories) as string[],
    isBase: row.is_base === 1,
    discoveredAt: row.discovered_at,
  }
}

function mapRecipe(row: RecipeRow): Recipe {
  return {
    id: row.id,
    inputA: row.input_a,
    inputB: row.input_b,
    resultId: row.result_id,
    discoveredAt: row.discovered_at,
  }
}

function mapWorkspaceItem(row: WorkspaceRow): WorkspaceElement {
  return {
    instanceId: row.instance_id,
    elementId: row.element_id,
    x: row.x,
    y: row.y,
  }
}

function normalizeRecipeInputs(nameA: string, nameB: string) {
  return [nameA, nameB].sort((a, b) => a.localeCompare(b, 'zh-CN')) as [string, string]
}

function readJsonSetting<T>(database: Database, key: string, fallback: T): T {
  const row = database
    .prepare('SELECT value FROM app_settings WHERE key = ?')
    .get(key) as SettingRow | undefined

  if (!row) return fallback

  try {
    return JSON.parse(row.value) as T
  } catch {
    return fallback
  }
}

function readStringSetting(database: Database, key: string, fallback: string): string {
  const row = database
    .prepare('SELECT value FROM app_settings WHERE key = ?')
    .get(key) as SettingRow | undefined

  return row?.value ?? fallback
}

function writeSetting(database: Database, key: string, value: string) {
  database
    .prepare(
      `
        INSERT INTO app_settings (key, value)
        VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `,
    )
    .run(key, value)
}

export class Repository {
  constructor(private readonly database: Database = db) {}

  getElements(): Element[] {
    const rows = this.database
      .prepare('SELECT * FROM elements ORDER BY discovered_at ASC, name ASC')
      .all() as ElementRow[]

    return rows.map(mapElement)
  }

  getElementById(id: string): Element | undefined {
    const row = this.database
      .prepare('SELECT * FROM elements WHERE id = ?')
      .get(id) as ElementRow | undefined

    return row ? mapElement(row) : undefined
  }

  findElementByName(name: string): Element | undefined {
    const row = this.database
      .prepare('SELECT * FROM elements WHERE name = ?')
      .get(name) as ElementRow | undefined

    return row ? mapElement(row) : undefined
  }

  insertElement(element: Element) {
    this.database
      .prepare(
        `
          INSERT INTO elements (id, name, emoji, categories, is_base, discovered_at)
          VALUES (@id, @name, @emoji, @categories, @isBase, @discoveredAt)
        `,
      )
      .run({
        id: element.id,
        name: element.name,
        emoji: element.emoji,
        categories: JSON.stringify(element.categories),
        isBase: element.isBase ? 1 : 0,
        discoveredAt: element.discoveredAt,
      })
  }

  getRecipes(): Recipe[] {
    const rows = this.database
      .prepare('SELECT * FROM recipes ORDER BY discovered_at ASC')
      .all() as RecipeRow[]

    return rows.map(mapRecipe)
  }

  findRecipe(nameA: string, nameB: string): Recipe | undefined {
    const [inputA, inputB] = normalizeRecipeInputs(nameA, nameB)
    const row = this.database
      .prepare('SELECT * FROM recipes WHERE input_a = ? AND input_b = ?')
      .get(inputA, inputB) as RecipeRow | undefined

    return row ? mapRecipe(row) : undefined
  }

  insertRecipe(recipe: Recipe) {
    const [inputA, inputB] = normalizeRecipeInputs(recipe.inputA, recipe.inputB)

    this.database
      .prepare(
        `
          INSERT INTO recipes (id, input_a, input_b, result_id, discovered_at)
          VALUES (?, ?, ?, ?, ?)
        `,
      )
      .run(recipe.id, inputA, inputB, recipe.resultId, recipe.discoveredAt)
  }

  getWorkspace(): WorkspaceStateSnapshot {
    const rows = this.database
      .prepare('SELECT * FROM workspace_items ORDER BY rowid ASC')
      .all() as WorkspaceRow[]

    const view = readJsonSetting(this.database, 'workspaceView', {
      scale: 1,
      panX: 0,
      panY: 0,
    })

    return {
      items: rows.map(mapWorkspaceItem),
      scale: typeof view.scale === 'number' ? view.scale : 1,
      panX: typeof view.panX === 'number' ? view.panX : 0,
      panY: typeof view.panY === 'number' ? view.panY : 0,
    }
  }

  replaceWorkspace(workspace: WorkspaceStateSnapshot) {
    const replace = this.database.transaction(() => {
      this.database.prepare('DELETE FROM workspace_items').run()

      const insert = this.database.prepare(
        `
          INSERT INTO workspace_items (instance_id, element_id, x, y)
          VALUES (@instanceId, @elementId, @x, @y)
        `,
      )

      for (const item of workspace.items) {
        insert.run(item)
      }

      writeSetting(this.database, 'workspaceView', JSON.stringify({
        scale: workspace.scale,
        panX: workspace.panX,
        panY: workspace.panY,
      }))
    })

    replace()
  }

  getSettings(): SettingsPayload {
    const aiConfig = readJsonSetting<AIConfig>(this.database, 'aiConfig', env.defaultAiConfig ?? DEFAULT_AI_CONFIG)
    const craftCount = Number.parseInt(readStringSetting(this.database, 'craftCount', '0'), 10)

    return {
      aiConfig: {
        baseUrl: aiConfig.baseUrl || DEFAULT_AI_CONFIG.baseUrl,
        model: aiConfig.model || DEFAULT_AI_CONFIG.model,
        timeoutMs: aiConfig.timeoutMs || DEFAULT_AI_CONFIG.timeoutMs,
      },
      craftCount: Number.isFinite(craftCount) ? craftCount : 0,
      hasApiKey: Boolean(env.openAiApiKey),
    }
  }

  updateSettings(input: Partial<Pick<SettingsPayload, 'craftCount'>> & { aiConfig?: Partial<AIConfig> }): SettingsPayload {
    const current = this.getSettings()

    const nextAiConfig: AIConfig = {
      ...current.aiConfig,
      ...input.aiConfig,
    }

    const nextCraftCount = typeof input.craftCount === 'number'
      ? Math.max(0, Math.floor(input.craftCount))
      : current.craftCount

    writeSetting(this.database, 'aiConfig', JSON.stringify(nextAiConfig))
    writeSetting(this.database, 'craftCount', String(nextCraftCount))

    return {
      aiConfig: nextAiConfig,
      craftCount: nextCraftCount,
      hasApiKey: current.hasApiKey,
    }
  }

  incrementCraftCount(): number {
    const next = this.getSettings().craftCount + 1
    writeSetting(this.database, 'craftCount', String(next))
    return next
  }

  getAppState(): AppStatePayload {
    return {
      elements: this.getElements(),
      recipes: this.getRecipes(),
      workspace: this.getWorkspace(),
      settings: this.getSettings(),
    }
  }

  replaceAppState(input: AppStatePayload): AppStatePayload {
    const replace = this.database.transaction(() => {
      this.database.prepare('DELETE FROM workspace_items').run()
      this.database.prepare('DELETE FROM recipes').run()
      this.database.prepare('DELETE FROM elements').run()

      const insertElement = this.database.prepare(
        `
          INSERT INTO elements (id, name, emoji, categories, is_base, discovered_at)
          VALUES (@id, @name, @emoji, @categories, @isBase, @discoveredAt)
        `,
      )

      for (const element of input.elements) {
        insertElement.run({
          id: element.id,
          name: element.name,
          emoji: element.emoji,
          categories: JSON.stringify(element.categories),
          isBase: element.isBase ? 1 : 0,
          discoveredAt: element.discoveredAt,
        })
      }

      const insertRecipe = this.database.prepare(
        `
          INSERT INTO recipes (id, input_a, input_b, result_id, discovered_at)
          VALUES (?, ?, ?, ?, ?)
        `,
      )

      for (const recipe of input.recipes) {
        const [inputA, inputB] = normalizeRecipeInputs(recipe.inputA, recipe.inputB)
        insertRecipe.run(recipe.id, inputA, inputB, recipe.resultId, recipe.discoveredAt)
      }

      const insertWorkspaceItem = this.database.prepare(
        `
          INSERT INTO workspace_items (instance_id, element_id, x, y)
          VALUES (@instanceId, @elementId, @x, @y)
        `,
      )

      for (const item of input.workspace.items) {
        insertWorkspaceItem.run(item)
      }

      writeSetting(this.database, 'workspaceView', JSON.stringify({
        scale: input.workspace.scale,
        panX: input.workspace.panX,
        panY: input.workspace.panY,
      }))

      writeSetting(this.database, 'aiConfig', JSON.stringify({
        baseUrl: input.settings.aiConfig.baseUrl,
        model: input.settings.aiConfig.model,
        timeoutMs: input.settings.aiConfig.timeoutMs,
      }))
      writeSetting(this.database, 'craftCount', String(Math.max(0, Math.floor(input.settings.craftCount))))
    })

    replace()
    return this.getAppState()
  }

  resetProgress(): AppStatePayload {
    const currentSettings = this.getSettings()

    return this.replaceAppState({
      elements: BASE_ELEMENTS,
      recipes: [],
      workspace: {
        items: [],
        scale: 1,
        panX: 0,
        panY: 0,
      },
      settings: {
        aiConfig: currentSettings.aiConfig,
        craftCount: 0,
        hasApiKey: currentSettings.hasApiKey,
      },
    })
  }
}

export const repository = new Repository()

import { BASE_ELEMENTS } from '../../src/utils/constants.js'
import { env } from '../config/env.js'
import { db } from './client.js'

function ensureSetting(key: string, value: string) {
  db.prepare(
    `
      INSERT INTO app_settings (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO NOTHING
    `,
  ).run(key, value)
}

export function runMigrations() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS elements (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      emoji TEXT NOT NULL,
      categories TEXT NOT NULL,
      is_base INTEGER NOT NULL,
      discovered_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      input_a TEXT NOT NULL,
      input_b TEXT NOT NULL,
      result_id TEXT,
      discovered_at INTEGER NOT NULL,
      UNIQUE(input_a, input_b),
      FOREIGN KEY(result_id) REFERENCES elements(id)
    );

    CREATE TABLE IF NOT EXISTS workspace_items (
      instance_id TEXT PRIMARY KEY,
      element_id TEXT NOT NULL,
      x REAL NOT NULL,
      y REAL NOT NULL,
      FOREIGN KEY(element_id) REFERENCES elements(id)
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)

  const insertElement = db.prepare(
    `
      INSERT INTO elements (id, name, emoji, categories, is_base, discovered_at)
      VALUES (@id, @name, @emoji, @categories, @isBase, @discoveredAt)
      ON CONFLICT(id) DO NOTHING
    `,
  )

  const seedBaseElements = db.transaction(() => {
    for (const element of BASE_ELEMENTS) {
      insertElement.run({
        id: element.id,
        name: element.name,
        emoji: element.emoji,
        categories: JSON.stringify(element.categories),
        isBase: element.isBase ? 1 : 0,
        discoveredAt: element.discoveredAt,
      })
    }
  })

  seedBaseElements()

  ensureSetting('aiConfig', JSON.stringify(env.defaultAiConfig))
  ensureSetting('craftCount', '0')
  ensureSetting('workspaceView', JSON.stringify({
    scale: 1,
    panX: 0,
    panY: 0,
  }))
}

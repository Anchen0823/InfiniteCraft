import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import Database from 'better-sqlite3'
import { env } from '../config/env.js'

mkdirSync(dirname(env.databasePath), { recursive: true })

export const db = new Database(env.databasePath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

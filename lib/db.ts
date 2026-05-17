/**
 * lib/db.ts
 *
 * SQLite singleton (better-sqlite3) — stores raw sources and processing logs.
 * Wiki pages / graph data are handled by HydraDB (see lib/hydra.ts).
 *
 * The singleton is attached to `globalThis` so Next.js hot-reload in dev
 * doesn't re-open the database file on every module evaluation.
 */

import Database from 'better-sqlite3'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'data', 'wiki.db')

// ---------------------------------------------------------------------------
// Singleton plumbing
// ---------------------------------------------------------------------------

declare global {
  // eslint-disable-next-line no-var
  var __db: Database.Database | undefined
}

function openDatabase(): Database.Database {
  const db = new Database(DB_PATH)

  // WAL mode for better concurrent read performance
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  createTables(db)
  return db
}

function createTables(db: Database.Database): void {
  db.exec(/* sql */ `
    -- Raw content scraped from URLs before AI processing
    CREATE TABLE IF NOT EXISTS sources (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      url         TEXT,
      title       TEXT,
      raw_content TEXT    NOT NULL,
      processed   INTEGER NOT NULL DEFAULT 0,
      created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- One log row per ingestion / processing run
    CREATE TABLE IF NOT EXISTS logs (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      source_id     INTEGER,
      pages_created INTEGER NOT NULL DEFAULT 0,
      pages_updated INTEGER NOT NULL DEFAULT 0,
      message       TEXT,
      created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `)
}

// Reuse existing instance across hot-reloads in development
export const db: Database.Database =
  globalThis.__db ?? (globalThis.__db = openDatabase())

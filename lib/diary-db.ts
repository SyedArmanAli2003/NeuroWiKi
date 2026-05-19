import { db } from './db'

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

db.exec(`
  CREATE TABLE IF NOT EXISTS diary_entries (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    date       TEXT NOT NULL,        -- YYYY-MM-DD
    time       TEXT NOT NULL,        -- HH:MM format
    kind       TEXT NOT NULL DEFAULT 'thought',
    title      TEXT,
    text       TEXT NOT NULL,
    filed_under TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS diary_meta (
    date       TEXT PRIMARY KEY,     -- YYYY-MM-DD
    intention  TEXT,
    intention_time TEXT,
    mood       TEXT,
    review     TEXT,
    streak     INTEGER NOT NULL DEFAULT 0
  );
`)

try {
  const cols = db.prepare(`PRAGMA table_info(diary_entries)`).all() as { name: string }[]
  if (!cols.find(c => c.name === 'title')) {
    db.exec(`ALTER TABLE diary_entries ADD COLUMN title TEXT`)
  }
} catch {}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EntryKind = 'thought' | 'link' | 'note' | 'decision' | 'question'

export interface DiaryEntry {
  id: number
  date: string
  time: string
  kind: EntryKind
  title: string | null
  text: string
  filed_under: string | null
  created_at: string
}

export interface DiaryMeta {
  date: string
  intention: string | null
  intention_time: string | null
  mood: string | null
  review: string | null
  streak: number
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function getTodayEntries(date: string): DiaryEntry[] {
  return db.prepare(`SELECT * FROM diary_entries WHERE date = ? ORDER BY created_at ASC`).all(date) as DiaryEntry[]
}

export function getEntriesInRange(from: string, to: string): DiaryEntry[] {
  return db.prepare(
    `SELECT * FROM diary_entries WHERE date >= ? AND date <= ? ORDER BY date DESC, created_at DESC`
  ).all(from, to) as DiaryEntry[]
}

export function insertEntry(entry: Omit<DiaryEntry, 'id' | 'created_at'>): DiaryEntry {
  const info = db.prepare(`
    INSERT INTO diary_entries (date, time, kind, title, text, filed_under)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(entry.date, entry.time, entry.kind, entry.title ?? null, entry.text, entry.filed_under ?? null)
  return db.prepare(`SELECT * FROM diary_entries WHERE id = ?`).get(info.lastInsertRowid) as DiaryEntry
}

export function getMeta(date: string): DiaryMeta | null {
  return db.prepare(`SELECT * FROM diary_meta WHERE date = ?`).get(date) as DiaryMeta | null
}

export function upsertMeta(date: string, fields: Partial<Omit<DiaryMeta, 'date'>>): DiaryMeta {
  const existing = getMeta(date)
  if (!existing) {
    db.prepare(`
      INSERT INTO diary_meta (date, intention, intention_time, mood, review, streak)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(date, fields.intention ?? null, fields.intention_time ?? null, fields.mood ?? null, fields.review ?? null, fields.streak ?? 0)
  } else {
    const sets = Object.entries(fields)
      .filter(([, v]) => v !== undefined)
      .map(([k]) => `${k} = ?`)
      .join(', ')
    const vals = Object.entries(fields)
      .filter(([, v]) => v !== undefined)
      .map(([, v]) => v)
    if (sets) db.prepare(`UPDATE diary_meta SET ${sets} WHERE date = ?`).run(...vals, date)
  }
  return getMeta(date) as DiaryMeta
}

export function computeStreak(today: string): number {
  // Count consecutive days (including today) that have at least 1 entry
  const rows = db.prepare(`
    SELECT DISTINCT date FROM diary_entries ORDER BY date DESC
  `).all() as { date: string }[]

  let streak = 0
  let cursor = new Date(today)
  for (const { date } of rows) {
    const d = cursor.toISOString().split('T')[0]
    if (date === d) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    } else if (date < d) {
      break
    }
  }
  return streak
}

export function updateEntry(id: number, fields: { text?: string; title?: string | null }): DiaryEntry | null {
  const sets: string[] = []
  const vals: any[] = []
  if (fields.text !== undefined)  { sets.push('text = ?');  vals.push(fields.text) }
  if (fields.title !== undefined) { sets.push('title = ?'); vals.push(fields.title) }
  if (sets.length) db.prepare(`UPDATE diary_entries SET ${sets.join(', ')} WHERE id = ?`).run(...vals, id)
  return db.prepare(`SELECT * FROM diary_entries WHERE id = ?`).get(id) as DiaryEntry | null
}

export function getPastDays(limit = 14): Array<{
  date: string
  weekday: string
  rel: string
  captures: number
  decisions: number
  mood: string | null
  headline: string | null
  quiet: boolean
}> {
  const rows = db.prepare(`
    SELECT
      e.date,
      COUNT(*) as captures,
      SUM(CASE WHEN e.kind = 'decision' THEN 1 ELSE 0 END) as decisions,
      m.mood,
      m.intention as headline
    FROM diary_entries e
    LEFT JOIN diary_meta m ON m.date = e.date
    GROUP BY e.date
    ORDER BY e.date DESC
    LIMIT ?
  `).all(limit) as any[]

  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const today = new Date().toISOString().split('T')[0]

  return rows.map((r) => {
    const d = new Date(r.date + 'T12:00:00')
    const diffMs = new Date(today + 'T12:00:00').getTime() - d.getTime()
    const diffDays = Math.round(diffMs / 86400000)
    const rel = diffDays === 0 ? 'today' : diffDays === 1 ? 'yesterday' : `${diffDays}d ago`
    return {
      date: r.date,
      weekday: weekdays[d.getDay()],
      rel,
      captures: r.captures,
      decisions: r.decisions,
      mood: r.mood ?? null,
      headline: r.headline ?? null,
      quiet: r.captures === 0,
    }
  })
}

/**
 * lib/user-db.ts
 * Users table — production-ready: bcrypt hashed passwords, stored in the same SQLite DB.
 */
import { db } from './db'
import bcrypt from 'bcryptjs'

// Ensure users table exists (idempotent migration)
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    email      TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    password   TEXT    NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`)

export interface User {
  id: number
  name: string
  email: string
  password: string
  created_at: string
}

export async function createUser(name: string, email: string, plainPassword: string): Promise<User> {
  const hashed = await bcrypt.hash(plainPassword, 12)
  const stmt = db.prepare(
    `INSERT INTO users (name, email, password) VALUES (?, ?, ?) RETURNING *`
  )
  return stmt.get(name, email.toLowerCase().trim(), hashed) as User
}

export function getUserByEmail(email: string): User | undefined {
  return db
    .prepare(`SELECT * FROM users WHERE email = ? COLLATE NOCASE`)
    .get(email.trim()) as User | undefined
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed)
}

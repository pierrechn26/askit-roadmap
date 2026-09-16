import type { VercelRequest, VercelResponse } from '@vercel/node'
import { neon } from '@neondatabase/serverless'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const sql = neon(process.env.DATABASE_URL!)

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'member',
      invited_by TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS app_tasks (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS app_objectives (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS app_deals (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS app_members (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      data JSONB NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `

  // Create admin if not exists
  const existing = await sql`SELECT id FROM users WHERE email = 'pierre.chenu@ask-it.ai'`
  if (existing.length === 0) {
    // Default admin password - should be changed after first login
    const { createHash } = await import('crypto')
    const hash = createHash('sha256').update('askit2026').digest('hex')
    await sql`INSERT INTO users (name, email, password_hash, role) VALUES ('Pierre', 'pierre.chenu@ask-it.ai', ${hash}, 'admin')`
  }

  return res.status(200).json({ success: true, message: 'Database setup complete' })
}

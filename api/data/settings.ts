import type { VercelRequest, VercelResponse } from '@vercel/node'
import { neon } from '@neondatabase/serverless'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const sql = neon(process.env.DATABASE_URL!)

  try {
    if (req.method === 'GET') {
      const rows = await sql`SELECT key, value FROM app_settings`
      const settings: Record<string, unknown> = {}
      for (const r of rows) {
        settings[r.key] = r.value
      }
      return res.status(200).json({ settings })
    }

    if (req.method === 'PUT') {
      const { key, value } = req.body
      if (!key) return res.status(400).json({ error: 'key required' })
      await sql`INSERT INTO app_settings (key, value, updated_at) VALUES (${key}, ${JSON.stringify(value)}, NOW()) ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(value)}, updated_at = NOW()`
      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('settings API error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

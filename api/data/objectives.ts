import type { VercelRequest, VercelResponse } from '@vercel/node'
import { neon } from '@neondatabase/serverless'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const sql = neon(process.env.DATABASE_URL!)

  try {
    if (req.method === 'GET') {
      const rows = await sql`SELECT id, data FROM app_objectives ORDER BY updated_at`
      const objectives = rows.map((r) => ({ ...r.data, id: r.id }))
      return res.status(200).json({ objectives })
    }

    if (req.method === 'POST') {
      const obj = req.body
      if (!obj || !obj.id) return res.status(400).json({ error: 'Objective with id required' })
      await sql`INSERT INTO app_objectives (id, data, updated_at) VALUES (${obj.id}, ${JSON.stringify(obj)}, NOW()) ON CONFLICT (id) DO UPDATE SET data = ${JSON.stringify(obj)}, updated_at = NOW()`
      return res.status(200).json({ success: true })
    }

    if (req.method === 'PUT') {
      if (Array.isArray(req.body)) {
        await sql`DELETE FROM app_objectives`
        for (const obj of req.body) {
          await sql`INSERT INTO app_objectives (id, data, updated_at) VALUES (${obj.id}, ${JSON.stringify(obj)}, NOW())`
        }
        return res.status(200).json({ success: true })
      }
      const obj = req.body
      if (!obj || !obj.id) return res.status(400).json({ error: 'Objective with id required' })
      await sql`UPDATE app_objectives SET data = ${JSON.stringify(obj)}, updated_at = NOW() WHERE id = ${obj.id}`
      return res.status(200).json({ success: true })
    }

    if (req.method === 'DELETE') {
      const { id } = req.body || req.query
      if (!id) return res.status(400).json({ error: 'id required' })
      await sql`DELETE FROM app_objectives WHERE id = ${id as string}`
      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('objectives API error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

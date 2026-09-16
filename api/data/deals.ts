import type { VercelRequest, VercelResponse } from '@vercel/node'
import { neon } from '@neondatabase/serverless'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const sql = neon(process.env.DATABASE_URL!)

  try {
    if (req.method === 'GET') {
      const rows = await sql`SELECT id, data FROM app_deals ORDER BY updated_at`
      const deals = rows.map((r) => ({ ...r.data, id: r.id }))
      return res.status(200).json({ deals })
    }

    if (req.method === 'POST') {
      const deal = req.body
      if (!deal || !deal.id) return res.status(400).json({ error: 'Deal with id required' })
      await sql`INSERT INTO app_deals (id, data, updated_at) VALUES (${deal.id}, ${JSON.stringify(deal)}, NOW()) ON CONFLICT (id) DO UPDATE SET data = ${JSON.stringify(deal)}, updated_at = NOW()`
      return res.status(200).json({ success: true })
    }

    if (req.method === 'PUT') {
      if (Array.isArray(req.body)) {
        await sql`DELETE FROM app_deals`
        for (const deal of req.body) {
          await sql`INSERT INTO app_deals (id, data, updated_at) VALUES (${deal.id}, ${JSON.stringify(deal)}, NOW())`
        }
        return res.status(200).json({ success: true })
      }
      const deal = req.body
      if (!deal || !deal.id) return res.status(400).json({ error: 'Deal with id required' })
      await sql`UPDATE app_deals SET data = ${JSON.stringify(deal)}, updated_at = NOW() WHERE id = ${deal.id}`
      return res.status(200).json({ success: true })
    }

    if (req.method === 'DELETE') {
      const { id } = req.body || req.query
      if (!id) return res.status(400).json({ error: 'id required' })
      await sql`DELETE FROM app_deals WHERE id = ${id as string}`
      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('deals API error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

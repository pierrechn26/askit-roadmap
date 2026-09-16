import type { VercelRequest, VercelResponse } from '@vercel/node'
import { neon } from '@neondatabase/serverless'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const sql = neon(process.env.DATABASE_URL!)

  try {
    if (req.method === 'GET') {
      const rows = await sql`SELECT name, data FROM app_members ORDER BY updated_at`
      const members = rows.map((r) => ({ ...r.data, name: r.name }))
      return res.status(200).json({ members })
    }

    if (req.method === 'PUT') {
      if (Array.isArray(req.body)) {
        await sql`DELETE FROM app_members`
        for (const member of req.body) {
          await sql`INSERT INTO app_members (name, data, updated_at) VALUES (${member.name}, ${JSON.stringify(member)}, NOW())`
        }
        return res.status(200).json({ success: true })
      }
      const member = req.body
      if (!member || !member.name) return res.status(400).json({ error: 'Member with name required' })
      const existing = await sql`SELECT id FROM app_members WHERE name = ${member.name}`
      if (existing.length > 0) {
        await sql`UPDATE app_members SET data = ${JSON.stringify(member)}, updated_at = NOW() WHERE name = ${member.name}`
      } else {
        await sql`INSERT INTO app_members (name, data, updated_at) VALUES (${member.name}, ${JSON.stringify(member)}, NOW())`
      }
      return res.status(200).json({ success: true })
    }

    if (req.method === 'DELETE') {
      const { name } = req.body || req.query
      if (!name) return res.status(400).json({ error: 'name required' })
      await sql`DELETE FROM app_members WHERE name = ${name as string}`
      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('members API error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

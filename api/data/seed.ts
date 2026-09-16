import type { VercelRequest, VercelResponse } from '@vercel/node'
import { neon } from '@neondatabase/serverless'

// Default data is duplicated here because Vercel serverless functions
// cannot import from src/ (Vite aliases like @/ don't resolve).

const DEFAULT_MEMBERS = [
  { name: 'Pierre', email: '', color: '#f8571f', role: 'general' },
  { name: 'Alice', email: '', color: '#10b981', role: 'general' },
  { name: 'Bastien', email: '', color: '#6366f1', role: 'dev' },
]

const DEFAULT_OBJECTIVES = [
  { id: '0', title: '100 clients actifs', subtitle: "Objectif principal de l'annee 2026", type: 'annuel', category: 'Global', period: '2026', done: false },
]

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const sql = neon(process.env.DATABASE_URL!)

  try {
    // Only seed if tables are empty
    const taskCount = await sql`SELECT COUNT(*) as c FROM app_tasks`
    const objCount = await sql`SELECT COUNT(*) as c FROM app_objectives`
    const memberCount = await sql`SELECT COUNT(*) as c FROM app_members`
    const settingsCount = await sql`SELECT COUNT(*) as c FROM app_settings`

    const seeded: string[] = []

    if (Number(objCount[0].c) === 0) {
      for (const obj of DEFAULT_OBJECTIVES) {
        await sql`INSERT INTO app_objectives (id, data, updated_at) VALUES (${obj.id}, ${JSON.stringify(obj)}, NOW())`
      }
      seeded.push('objectives')
    }

    if (Number(memberCount[0].c) === 0) {
      for (const m of DEFAULT_MEMBERS) {
        await sql`INSERT INTO app_members (name, data, updated_at) VALUES (${m.name}, ${JSON.stringify(m)}, NOW())`
      }
      seeded.push('members')
    }

    if (Number(settingsCount[0].c) === 0) {
      await sql`INSERT INTO app_settings (key, value, updated_at) VALUES ('clientCount', '10', NOW())`
      seeded.push('settings')
    }

    // Tasks and deals are seeded from the frontend on first load if empty
    // (they use the existing DEFAULT_TASKS and DEFAULT_DEALS from src/data/)

    return res.status(200).json({ success: true, seeded, message: seeded.length > 0 ? `Seeded: ${seeded.join(', ')}` : 'Already seeded' })
  } catch (err) {
    console.error('seed error:', err)
    return res.status(500).json({ error: 'Seed failed' })
  }
}

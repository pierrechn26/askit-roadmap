import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserPlus, Check, Loader2 } from 'lucide-react'

interface Props {
  currentUserEmail: string
}

export function InviteUser({ currentUserEmail }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  async function handleInvite() {
    if (!name.trim() || !email.trim()) return
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/auth/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), invitedBy: currentUserEmail }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erreur')
      } else {
        setSuccess(`Invitation envoyée à ${email}`)
        setName('')
        setEmail('')
      }
    } catch {
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-5 rounded-2xl border-0 shadow-sm">
      <h3 className="font-semibold flex items-center gap-2 mb-4 text-[#241f20]">
        <UserPlus className="h-5 w-5 text-[#f8571f]" /> Inviter un utilisateur
      </h3>
      <div className="space-y-2">
        <Input placeholder="Nom" value={name} onChange={(e) => setName(e.target.value)} className="h-9 rounded-xl" />
        <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-9 rounded-xl" />
        <Button
          onClick={handleInvite}
          disabled={loading || !name.trim() || !email.trim()}
          className="w-full rounded-full bg-[#f8571f] hover:bg-[#e04d1a] text-white"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Envoyer l\'invitation'}
        </Button>
        {success && (
          <p className="text-xs text-emerald-600 bg-emerald-50 rounded-xl px-3 py-2 flex items-center gap-1">
            <Check className="h-3 w-3" /> {success}
          </p>
        )}
        {error && <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>}
      </div>
    </Card>
  )
}

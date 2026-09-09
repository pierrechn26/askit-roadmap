import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Users } from 'lucide-react'
import type { TeamMember } from '@/types'

const COLORS = ['#f8571f', '#a7abdd', '#accce9', '#241f20', '#6c6560', '#ec4899', '#06b6d4', '#84cc16']

interface Props {
  members: TeamMember[]
  onMembersChange: (m: TeamMember[]) => void
}

export function TeamSettings({ members, onMembersChange }: Props) {
  const [newName, setNewName] = useState('')

  function addMember() {
    if (!newName.trim()) return
    const color = COLORS[members.length % COLORS.length]
    onMembersChange([...members, { name: newName.trim(), color }])
    setNewName('')
  }

  function removeMember(name: string) {
    onMembersChange(members.filter((m) => m.name !== name))
  }

  function updateName(oldName: string, newVal: string) {
    onMembersChange(members.map((m) => (m.name === oldName ? { ...m, name: newVal } : m)))
  }

  return (
    <Card className="p-5 rounded-2xl border-0 shadow-sm">
      <h3 className="font-semibold flex items-center gap-2 mb-4 text-[#241f20]">
        <Users className="h-5 w-5 text-[#f8571f]" /> Équipe
      </h3>
      <div className="space-y-2.5">
        {members.map((m) => (
          <div key={m.name} className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full shrink-0" style={{ background: m.color }} />
            <Input
              className="h-9 rounded-xl"
              value={m.name}
              onChange={(e) => updateName(m.name, e.target.value)}
            />
            <button onClick={() => removeMember(m.name)} className="text-[#a39c95] hover:text-[#ef4444] transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <div className="flex gap-2 pt-2">
          <Input
            placeholder="Nouveau membre"
            className="h-9 rounded-xl"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addMember()}
          />
          <Button size="sm" className="rounded-full bg-[#241f20] hover:bg-[#333] text-white" onClick={addMember}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

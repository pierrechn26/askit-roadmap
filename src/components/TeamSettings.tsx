import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Users, Mail, Code } from 'lucide-react'
import type { TeamMember } from '@/types'

const COLORS = ['#f8571f', '#a7abdd', '#accce9', '#241f20', '#6c6560', '#ec4899', '#06b6d4', '#84cc16']

interface Props {
  members: TeamMember[]
  onMembersChange: (m: TeamMember[]) => void
}

export function TeamSettings({ members, onMembersChange }: Props) {
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<'general' | 'dev'>('general')

  function addMember() {
    if (!newName.trim()) return
    const color = COLORS[members.length % COLORS.length]
    onMembersChange([...members, { name: newName.trim(), email: newEmail.trim(), color, role: newRole }])
    setNewName('')
    setNewEmail('')
    setNewRole('general')
  }

  function removeMember(name: string) {
    onMembersChange(members.filter((m) => m.name !== name))
  }

  function updateMember(oldName: string, updates: Partial<TeamMember>) {
    onMembersChange(members.map((m) => (m.name === oldName ? { ...m, ...updates } : m)))
  }

  const devMembers = members.filter((m) => m.role === 'dev')
  const generalMembers = members.filter((m) => m.role !== 'dev')

  return (
    <div className="space-y-6 max-w-lg">
      {/* Dev team */}
      {devMembers.length > 0 && (
        <Card className="p-5 rounded-2xl border-0 shadow-sm">
          <h3 className="font-semibold flex items-center gap-2 mb-4 text-[#241f20]">
            <Code className="h-5 w-5 text-[#a7abdd]" /> Équipe Dev
          </h3>
          <div className="space-y-3">
            {devMembers.map((m) => (
              <MemberRow key={m.name} member={m} onUpdate={updateMember} onRemove={removeMember} />
            ))}
          </div>
        </Card>
      )}

      {/* General team */}
      <Card className="p-5 rounded-2xl border-0 shadow-sm">
        <h3 className="font-semibold flex items-center gap-2 mb-4 text-[#241f20]">
          <Users className="h-5 w-5 text-[#f8571f]" /> Équipe
        </h3>
        <div className="space-y-3">
          {generalMembers.map((m) => (
            <MemberRow key={m.name} member={m} onUpdate={updateMember} onRemove={removeMember} />
          ))}
        </div>

        {/* Add member */}
        <div className="mt-4 pt-4 border-t border-[rgba(36,31,32,0.06)]">
          <p className="text-xs text-[#6c6560] mb-2 font-medium">Ajouter un membre</p>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Nom"
                className="h-9 rounded-xl flex-1"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <Input
                placeholder="Email"
                type="email"
                className="h-9 rounded-xl flex-1"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <div className="flex gap-2 items-center">
              <div className="flex gap-1.5 flex-1">
                <button
                  onClick={() => setNewRole('general')}
                  className={`text-xs px-3 py-1 rounded-full transition-all ${
                    newRole === 'general' ? 'bg-[#241f20] text-white' : 'bg-[#f5f5f7] text-[#6c6560]'
                  }`}
                >
                  Général
                </button>
                <button
                  onClick={() => setNewRole('dev')}
                  className={`text-xs px-3 py-1 rounded-full transition-all flex items-center gap-1 ${
                    newRole === 'dev' ? 'bg-[#a7abdd] text-white' : 'bg-[#f5f5f7] text-[#6c6560]'
                  }`}
                >
                  <Code className="h-3 w-3" /> Dev
                </button>
              </div>
              <Button
                size="sm"
                className="rounded-full bg-[#241f20] hover:bg-[#333] text-white"
                onClick={addMember}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

function MemberRow({
  member,
  onUpdate,
  onRemove,
}: {
  member: TeamMember
  onUpdate: (oldName: string, updates: Partial<TeamMember>) => void
  onRemove: (name: string) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 rounded-full shrink-0" style={{ background: member.color }} />
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <Input
            className="h-8 rounded-lg text-sm font-medium"
            value={member.name}
            onChange={(e) => onUpdate(member.name, { name: e.target.value })}
          />
          {member.role === 'dev' && (
            <Badge className="text-[9px] bg-[#a7abdd]/20 text-[#241f20] border-0 shrink-0">DEV</Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Mail className="h-3 w-3 text-[#a39c95]" />
          <Input
            className="h-7 rounded-lg text-xs"
            placeholder="email@example.com"
            type="email"
            value={member.email}
            onChange={(e) => onUpdate(member.name, { email: e.target.value })}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <button
          onClick={() => onUpdate(member.name, { role: member.role === 'dev' ? 'general' : 'dev' })}
          className={`text-[10px] px-1.5 py-0.5 rounded transition-all ${
            member.role === 'dev' ? 'bg-[#a7abdd]/20 text-[#241f20]' : 'bg-[#f5f5f7] text-[#a39c95]'
          }`}
          title="Toggle rôle Dev"
        >
          <Code className="h-3 w-3" />
        </button>
        <button onClick={() => onRemove(member.name)} className="text-[#a39c95] hover:text-[#ef4444] transition-colors">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

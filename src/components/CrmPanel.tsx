import { useState, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Plus, TrendingUp, Trophy, XCircle, Clock, CalendarClock, Send,
  ChevronUp, ChevronDown, GripVertical, AlertCircle, StickyNote, X,
  Mail, Phone, ExternalLink,
} from 'lucide-react'
import { differenceInDays } from 'date-fns'
import type { CrmDeal, CrmStage, CrmNote } from '@/types/crm'
import { CRM_STAGES, CRM_STAGE_LABELS, CRM_STAGE_COLORS } from '@/types/crm'
import { formatDateFR, getDateUrgency, DATE_BADGE_STYLES } from '@/lib/dates'

interface Props {
  deals: CrmDeal[]
  onDealsChange: (d: CrmDeal[]) => void
}

export function CrmPanel({ deals, onDealsChange }: Props) {
  const [createOpen, setCreateOpen] = useState(false)
  const [detailDeal, setDetailDeal] = useState<CrmDeal | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [tasksExpanded, setTasksExpanded] = useState(true)
  const dragItem = useRef<string | null>(null)
  const dragOverStage = useRef<CrmStage | null>(null)

  // New deal form
  const [form, setForm] = useState({
    company: '', contact: '', email: '', phone: '', linkedin: '', amount: '', source: '', nextAction: '', nextActionDate: '',
  })

  function createDeal() {
    if (!form.company.trim()) return
    const deal: CrmDeal = {
      id: Date.now().toString(),
      company: form.company.trim(),
      contact: form.contact.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      linkedin: form.linkedin.trim(),
      amount: parseFloat(form.amount) || 0,
      stage: 'a_contacter',
      notes: [],
      source: form.source.trim(),
      createdAt: new Date().toISOString().slice(0, 10),
      closedAt: '',
      nextAction: form.nextAction.trim(),
      nextActionDate: form.nextActionDate,
    }
    onDealsChange([...deals, deal])
    setForm({ company: '', contact: '', email: '', phone: '', linkedin: '', amount: '', source: '', nextAction: '', nextActionDate: '' })
    setCreateOpen(false)
  }

  function updateDeal(updated: CrmDeal) {
    onDealsChange(deals.map((d) => d.id === updated.id ? updated : d))
    setDetailDeal(updated)
  }

  function moveDeal(dealId: string, newStage: CrmStage) {
    onDealsChange(deals.map((d) => {
      if (d.id !== dealId) return d
      const closedAt = (newStage === 'deal_gagne' || newStage === 'deal_perdu')
        ? new Date().toISOString().slice(0, 10) : d.closedAt
      return { ...d, stage: newStage, closedAt }
    }))
  }

  function removeDeal(id: string) {
    onDealsChange(deals.filter((d) => d.id !== id))
    if (detailDeal?.id === id) { setDetailOpen(false); setDetailDeal(null) }
  }

  // --- KPIs ---
  const activeStages: CrmStage[] = ['a_contacter', 'prospect_froid', 'prospect_chaud', 'r1', 'followup', 'fantome', 'valide_attente']
  const pipelineDeals = deals.filter((d) => activeStages.includes(d.stage))
  const wonDeals = deals.filter((d) => d.stage === 'deal_gagne')
  const lostDeals = deals.filter((d) => d.stage === 'deal_perdu')

  const pipelineMonthly = pipelineDeals.reduce((s, d) => s + d.amount, 0)
  const wonMonthly = wonDeals.reduce((s, d) => s + d.amount, 0)
  const lostMonthly = lostDeals.reduce((s, d) => s + d.amount, 0)

  const closedDeals = [...wonDeals, ...lostDeals]
  const conversionRate = closedDeals.length > 0
    ? Math.round((wonDeals.length / closedDeals.length) * 100) : 0

  const avgClosingDays = wonDeals.length > 0
    ? Math.round(wonDeals.reduce((s, d) => {
        const days = d.closedAt ? differenceInDays(new Date(d.closedAt), new Date(d.createdAt)) : 0
        return s + Math.max(days, 0)
      }, 0) / wonDeals.length)
    : 0

  // Upcoming tasks
  const upcomingTasks = deals
    .filter((d) => d.nextAction && d.nextActionDate && activeStages.includes(d.stage))
    .sort((a, b) => a.nextActionDate.localeCompare(b.nextActionDate))

  const overdueTasks = upcomingTasks.filter((d) => getDateUrgency(d.nextActionDate) === 'overdue')

  // --- Drag & Drop ---
  function handleDragStart(dealId: string) {
    dragItem.current = dealId
  }

  function handleDragOver(e: React.DragEvent, stage: CrmStage) {
    e.preventDefault()
    dragOverStage.current = stage
  }

  function handleDrop(stage: CrmStage) {
    if (dragItem.current) {
      moveDeal(dragItem.current, stage)
      dragItem.current = null
      dragOverStage.current = null
    }
  }

  function fmt(n: number) {
    return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#241f20]">CRM</h2>
          <p className="text-sm text-[#a39c95]">Suivez vos deals en cours</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full bg-[#241f20] hover:bg-[#333] text-white">
              <Plus className="h-4 w-4 mr-1" /> Nouveau prospect
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-w-md">
            <DialogHeader><DialogTitle className="text-[#241f20]">Nouveau prospect</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Entreprise" className="rounded-xl" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                <Input placeholder="Nom du contact" className="rounded-xl" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Email" type="email" className="rounded-xl" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <Input placeholder="Téléphone" type="tel" className="rounded-xl" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <Input placeholder="URL LinkedIn" className="rounded-xl" value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-[#a39c95] mb-1 block">Montant mensuel (€)</label>
                  <Input type="number" placeholder="0" className="rounded-xl" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-[#a39c95] mb-1 block">Source</label>
                  <Input placeholder="Referral, LinkedIn..." className="rounded-xl" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-[#a39c95] mb-1 block">Prochaine action</label>
                  <Input placeholder="Relance mail..." className="rounded-xl" value={form.nextAction} onChange={(e) => setForm({ ...form, nextAction: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-[#a39c95] mb-1 block">Date action</label>
                  <Input type="date" className="rounded-xl" value={form.nextActionDate} onChange={(e) => setForm({ ...form, nextActionDate: e.target.value })} />
                </div>
              </div>
              <Button onClick={createDeal} disabled={!form.company.trim()} className="w-full rounded-full bg-[#f8571f] hover:bg-[#e04d1a] text-white">
                Ajouter
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-5 rounded-2xl border-0 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#f8571f]" />
              <span className="text-sm font-medium text-[#241f20]">Pipeline en cours</span>
            </div>
            <Badge className="bg-[#f5f5f7] text-[#241f20] border-0 rounded-full text-xs">{pipelineDeals.length} deals</Badge>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-[#a39c95]">Mensuel</span>
              <span className="font-semibold text-[#241f20]">{fmt(pipelineMonthly)} €</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#a39c95]">Annuel</span>
              <span className="font-semibold text-[#241f20]">{fmt(pipelineMonthly * 12)} €</span>
            </div>
          </div>
        </Card>

        <Card className="p-5 rounded-2xl border-0 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-emerald-500" />
              <span className="text-sm font-medium text-[#241f20]">Deals gagnés</span>
            </div>
            <Badge className="bg-emerald-50 text-emerald-600 border-0 rounded-full text-xs">{wonDeals.length} deals</Badge>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-[#a39c95]">Mensuel</span>
              <span className="font-semibold text-emerald-600">{fmt(wonMonthly)} €</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#a39c95]">Annuel</span>
              <span className="font-semibold text-emerald-600">{fmt(wonMonthly * 12)} €</span>
            </div>
          </div>
        </Card>

        <Card className="p-5 rounded-2xl border-0 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-400" />
              <span className="text-sm font-medium text-[#241f20]">Deals perdus</span>
            </div>
            <Badge className="bg-red-50 text-red-500 border-0 rounded-full text-xs">{lostDeals.length} deals</Badge>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-[#a39c95]">Mensuel</span>
              <span className="font-semibold text-red-500">{fmt(lostMonthly)} €</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#a39c95]">Annuel</span>
              <span className="font-semibold text-red-500">{fmt(lostMonthly * 12)} €</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Conversion + Closing */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5 rounded-2xl border-0 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#f5f5f7] flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-[#241f20]" />
          </div>
          <div>
            <p className="text-xs text-[#a39c95]">Taux de conversion</p>
            <p className="text-2xl font-bold text-[#241f20]">{conversionRate}%</p>
          </div>
        </Card>
        <Card className="p-5 rounded-2xl border-0 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#f5f5f7] flex items-center justify-center">
            <Clock className="h-5 w-5 text-[#241f20]" />
          </div>
          <div>
            <p className="text-xs text-[#a39c95]">Closing moyen</p>
            <p className="text-2xl font-bold text-[#241f20]">{avgClosingDays} j</p>
          </div>
        </Card>
      </div>

      {/* Upcoming tasks */}
      <Card className="rounded-2xl border-0 shadow-sm overflow-hidden">
        <button
          onClick={() => setTasksExpanded(!tasksExpanded)}
          className="w-full p-4 flex items-center justify-between hover:bg-[#f5f5f7]/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-[#241f20]" />
            <span className="text-sm font-medium text-[#241f20]">Tâches à venir</span>
            {overdueTasks.length > 0 && (
              <Badge className="bg-red-50 text-red-600 border border-red-200 rounded-full text-[10px]">
                {overdueTasks.length} en retard
              </Badge>
            )}
          </div>
          {tasksExpanded ? <ChevronUp className="h-4 w-4 text-[#a39c95]" /> : <ChevronDown className="h-4 w-4 text-[#a39c95]" />}
        </button>
        {tasksExpanded && (
          <div className="px-4 pb-4 space-y-1">
            {upcomingTasks.length === 0 && <p className="text-xs text-[#a39c95] text-center py-2">Aucune tâche à venir</p>}
            {upcomingTasks.map((deal) => {
              const urg = getDateUrgency(deal.nextActionDate)
              return (
                <button
                  key={deal.id}
                  onClick={() => { setDetailDeal(deal); setDetailOpen(true) }}
                  className="w-full flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-[#f5f5f7] transition-colors text-left"
                >
                  {urg === 'overdue' && <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-[#241f20]">{deal.company}</span>
                    <span className="text-xs text-[#a39c95] ml-2">— {deal.contact}</span>
                    <p className="text-xs text-[#6c6560]">{deal.nextAction}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${DATE_BADGE_STYLES[urg]}`}>
                    {formatDateFR(deal.nextActionDate)}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </Card>

      {/* Pipeline Kanban */}
      <div className="overflow-x-auto -mx-6 px-6">
        <div className="flex gap-3" style={{ minWidth: `${CRM_STAGES.length * 220}px` }}>
          {CRM_STAGES.map((stage) => {
            const stageDeals = deals.filter((d) => d.stage === stage)
            const stageTotal = stageDeals.reduce((s, d) => s + d.amount, 0)
            return (
              <div
                key={stage}
                className="flex-1 min-w-[200px]"
                onDragOver={(e) => handleDragOver(e, stage)}
                onDrop={() => handleDrop(stage)}
              >
                {/* Column header */}
                <div className="flex items-center gap-2 mb-2 px-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CRM_STAGE_COLORS[stage] }} />
                  <span className="text-xs font-medium text-[#241f20]">{CRM_STAGE_LABELS[stage]}</span>
                  <Badge className="bg-[#f5f5f7] text-[#6c6560] border-0 rounded-full text-[10px] ml-auto">{stageDeals.length}</Badge>
                </div>
                <p className="text-[10px] text-[#a39c95] px-1 mb-2">{fmt(stageTotal)} €/mois</p>

                {/* Column body */}
                <div className="space-y-2 min-h-[100px] bg-[#f5f5f7]/40 rounded-xl p-2">
                  {stageDeals.map((deal) => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      onDragStart={handleDragStart}
                      onClick={() => { setDetailDeal(deal); setDetailOpen(true) }}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Deal detail sheet */}
      <DealDetailSheet
        deal={detailDeal}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdate={updateDeal}
        onDelete={removeDeal}
      />
    </div>
  )
}

// ── Deal Card ──
function DealCard({ deal, onDragStart, onClick }: { deal: CrmDeal; onDragStart: (id: string) => void; onClick: () => void }) {
  const urg = deal.nextActionDate ? getDateUrgency(deal.nextActionDate) : 'normal'

  return (
    <div
      draggable
      onDragStart={() => onDragStart(deal.id)}
      onClick={onClick}
      className={`bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${
        urg === 'overdue' ? 'ring-1 ring-red-300' : urg === 'urgent' ? 'ring-1 ring-[#f8571f]/30' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="h-3.5 w-3.5 text-[#a39c95] mt-0.5 shrink-0 opacity-40" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#241f20] truncate">{deal.company}</p>
          <p className="text-xs text-[#a39c95] truncate">{deal.contact}</p>
          {deal.amount > 0 && (
            <p className="text-xs font-semibold text-[#f8571f] mt-1">{deal.amount.toLocaleString('fr-FR')} €/m</p>
          )}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {deal.nextActionDate && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${DATE_BADGE_STYLES[urg]}`}>
                {formatDateFR(deal.nextActionDate)}
              </span>
            )}
            {deal.source && (
              <span className="text-[9px] text-[#a39c95]">{deal.source}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Deal Detail Sheet ──
function DealDetailSheet({ deal, open, onOpenChange, onUpdate, onDelete }: {
  deal: CrmDeal | null; open: boolean; onOpenChange: (o: boolean) => void;
  onUpdate: (d: CrmDeal) => void; onDelete: (id: string) => void;
}) {
  const [newNote, setNewNote] = useState('')

  if (!deal) return null

  function update<K extends keyof CrmDeal>(key: K, value: CrmDeal[K]) {
    onUpdate({ ...deal!, [key]: value })
  }

  function addNote() {
    if (!newNote.trim()) return
    const note: CrmNote = {
      id: Date.now().toString(),
      content: newNote.trim(),
      author: 'Pierre',
      createdAt: new Date().toISOString(),
    }
    update('notes', [...deal!.notes, note])
    setNewNote('')
  }

  function removeNote(id: string) {
    update('notes', deal!.notes.filter((n) => n.id !== id))
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "à l'instant"
    if (mins < 60) return `il y a ${mins}min`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `il y a ${hours}h`
    return `il y a ${Math.floor(hours / 24)}j`
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] sm:max-w-[500px] p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-[rgba(36,31,32,0.06)]">
          <SheetTitle className="sr-only">Détail du deal</SheetTitle>
          <Input value={deal.company} onChange={(e) => update('company', e.target.value)}
            className="text-lg font-semibold border-0 p-0 h-auto focus-visible:ring-0 text-[#241f20]" />
          <Input value={deal.contact} onChange={(e) => update('contact', e.target.value)}
            placeholder="Contact" className="text-sm border-0 p-0 h-auto focus-visible:ring-0 text-[#6c6560] mt-1" />
          <div className="flex gap-2 mt-3 flex-wrap">
            <Select value={deal.stage} onValueChange={(v) => {
              const closedAt = (v === 'deal_gagne' || v === 'deal_perdu') ? new Date().toISOString().slice(0, 10) : deal.closedAt
              onUpdate({ ...deal, stage: v as CrmStage, closedAt })
            }}>
              <SelectTrigger className="w-[200px] h-8 rounded-full text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CRM_STAGE_COLORS[deal.stage] }} />
                  <span>{CRM_STAGE_LABELS[deal.stage]}</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {CRM_STAGES.map((s) => (
                  <SelectItem key={s} value={s}>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CRM_STAGE_COLORS[s] }} />
                      {CRM_STAGE_LABELS[s]}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {deal.amount > 0 && (
              <Badge className="bg-[#f8571f]/10 text-[#f8571f] border-0 rounded-full text-xs font-semibold">
                {deal.amount.toLocaleString('fr-FR')} €/mois
              </Badge>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 py-4 space-y-5">
            {/* Contact info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-[#a39c95] shrink-0" />
                <Input value={deal.email || ''} onChange={(e) => update('email', e.target.value)}
                  placeholder="Email" type="email" className="rounded-lg text-sm h-8" />
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-[#a39c95] shrink-0" />
                <Input value={deal.phone || ''} onChange={(e) => update('phone', e.target.value)}
                  placeholder="Téléphone" type="tel" className="rounded-lg text-sm h-8" />
              </div>
              <div className="flex items-center gap-2">
                <ExternalLink className="h-3.5 w-3.5 text-[#a39c95] shrink-0" />
                <Input value={deal.linkedin || ''} onChange={(e) => update('linkedin', e.target.value)}
                  placeholder="URL LinkedIn" className="rounded-lg text-sm h-8" />
                {deal.linkedin && (
                  <a href={deal.linkedin} target="_blank" rel="noopener noreferrer"
                    className="text-[10px] text-[#f8571f] hover:underline shrink-0">Ouvrir</a>
                )}
              </div>
            </div>

            <Separator />

            {/* Amount + Source */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[#6c6560] uppercase tracking-wider mb-1.5 block">Montant mensuel (€)</label>
                <Input type="number" value={deal.amount || ''} onChange={(e) => update('amount', parseFloat(e.target.value) || 0)} className="rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#6c6560] uppercase tracking-wider mb-1.5 block">Source</label>
                <Input value={deal.source} onChange={(e) => update('source', e.target.value)} placeholder="Referral, LinkedIn..." className="rounded-xl text-sm" />
              </div>
            </div>

            {/* Next action */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[#6c6560] uppercase tracking-wider mb-1.5 block">Prochaine action</label>
                <Input value={deal.nextAction} onChange={(e) => update('nextAction', e.target.value)} placeholder="Relance mail..." className="rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#6c6560] uppercase tracking-wider mb-1.5 block">Date action</label>
                <Input type="date" value={deal.nextActionDate} onChange={(e) => update('nextActionDate', e.target.value)} className="rounded-xl text-sm" />
              </div>
            </div>

            {/* Dates */}
            <div className="flex gap-4 text-xs text-[#a39c95]">
              <span>Créé le {formatDateFR(deal.createdAt)}</span>
              {deal.closedAt && <span>Clôturé le {formatDateFR(deal.closedAt)}</span>}
            </div>

            <Separator />

            {/* Notes */}
            <div>
              <label className="text-xs font-medium text-[#6c6560] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <StickyNote className="h-3.5 w-3.5" /> Notes
              </label>
              {deal.notes.length === 0 && <p className="text-xs text-[#a39c95] text-center py-3">Aucune note</p>}
              <div className="space-y-2">
                {deal.notes.map((note) => (
                  <div key={note.id} className="group flex gap-2.5">
                    <div className="mt-0.5 w-6 h-6 rounded-full bg-[#f5f5f7] flex items-center justify-center shrink-0 text-[10px] font-bold text-[#6c6560]">
                      {note.author.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] font-medium text-[#241f20]">{note.author}</span>
                        <span className="text-[9px] text-[#a39c95]">{timeAgo(note.createdAt)}</span>
                        <button onClick={() => removeNote(note.id)} className="ml-auto opacity-0 group-hover:opacity-100 text-[#a39c95] hover:text-red-500 transition-all">
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                      <p className="text-sm bg-[#f5f5f7] rounded-xl px-3 py-1.5 text-[#241f20] whitespace-pre-wrap break-words">{note.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Delete */}
            <Button variant="ghost" size="sm" onClick={() => { onDelete(deal.id); onOpenChange(false) }}
              className="w-full rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 text-xs">
              Supprimer ce deal
            </Button>
          </div>
        </ScrollArea>

        {/* Note compose */}
        <div className="border-t border-[rgba(36,31,32,0.06)] p-4 flex gap-2">
          <Textarea
            placeholder="Ajouter une note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addNote() } }}
            className="rounded-xl text-sm min-h-[38px] max-h-[120px] resize-none"
            rows={1}
          />
          <Button size="sm" onClick={addNote} disabled={!newNote.trim()} className="rounded-full bg-[#241f20] hover:bg-[#333] text-white px-3">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

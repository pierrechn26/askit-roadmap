import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  CheckCircle2, Circle, Plus, Target, Trophy, Star, CalendarDays,
  CalendarClock, CalendarIcon, Pencil, ListTodo,
} from 'lucide-react'
import { addDays, format, getISOWeek, startOfISOWeek } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Objective, ObjectiveCategory, Task } from '@/types'
import { OBJECTIVE_CATEGORIES } from '@/types'

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

const CATEGORY_COLORS: Record<ObjectiveCategory, string> = {
  Global: 'bg-[#241f20] text-white',
  Marketing: 'bg-[#f8571f]/10 text-[#f8571f]',
  Produit: 'bg-[#a7abdd]/20 text-[#241f20]',
  Commercial: 'bg-[#accce9]/20 text-[#241f20]',
  Tech: 'bg-purple-100 text-purple-700',
  Ops: 'bg-amber-100 text-amber-700',
}

function formatWeekLabel(period: string): { short: string; detail: string } {
  const match = period.match(/(\d{4})-W(\d{2})/)
  if (!match) return { short: period, detail: '' }
  const [, yearStr, weekStr] = match
  const weekNum = parseInt(weekStr)
  const year = parseInt(yearStr)
  const weekStart = startOfISOWeek(new Date(year, 0, 4 + (weekNum - 1) * 7))
  const weekEnd = addDays(weekStart, 6)
  return {
    short: `S${weekNum}`,
    detail: `${format(weekStart, 'd MMM', { locale: fr })} – ${format(weekEnd, 'd MMM', { locale: fr })}`,
  }
}

function getWeekFromDate(date: Date): string {
  const week = getISOWeek(date)
  const year = date.getFullYear()
  return `${year}-W${week.toString().padStart(2, '0')}`
}

function getWeekRangeFromDate(date: Date): string {
  const weekStart = startOfISOWeek(date)
  const weekEnd = addDays(weekStart, 6)
  const weekNum = getISOWeek(date)
  return `Semaine ${weekNum} — du ${format(weekStart, 'd MMMM', { locale: fr })} au ${format(weekEnd, 'd MMMM', { locale: fr })}`
}

interface Props {
  clientCount: number
  onClientCountChange: (n: number) => void
  objectives: Objective[]
  onObjectivesChange: (o: Objective[]) => void
  tasks: Task[]
  onTaskClick: (task: Task) => void
}

export function ObjectivePanel({ clientCount, onClientCountChange, objectives, onObjectivesChange, tasks, onTaskClick }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingObj, setEditingObj] = useState<Objective | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formSubtitle, setFormSubtitle] = useState('')
  const [formType, setFormType] = useState<'annuel' | 'mensuel' | 'hebdo'>('mensuel')
  const [formCategory, setFormCategory] = useState<ObjectiveCategory>('Global')
  const [formPeriod, setFormPeriod] = useState('2026-10')
  const [selectedWeekDate, setSelectedWeekDate] = useState<Date | undefined>(undefined)
  const [editingCount, setEditingCount] = useState(false)

  const target = 100
  const pct = Math.round((clientCount / target) * 100)
  const milestones = [{ value: 25, label: '25' }, { value: 50, label: '50' }, { value: 75, label: '75' }]

  function openCreateDialog() {
    setEditingObj(null)
    setFormTitle('')
    setFormSubtitle('')
    setFormType('mensuel')
    setFormCategory('Global')
    setFormPeriod('2026-10')
    setSelectedWeekDate(undefined)
    setDialogOpen(true)
  }

  function openEditDialog(obj: Objective) {
    setEditingObj(obj)
    setFormTitle(obj.title)
    setFormSubtitle(obj.subtitle || '')
    setFormType(obj.type)
    setFormCategory(obj.category || 'Global')
    setFormPeriod(obj.period)
    if (obj.type === 'hebdo') {
      const match = obj.period.match(/(\d{4})-W(\d{2})/)
      if (match) {
        const weekNum = parseInt(match[2])
        const year = parseInt(match[1])
        setSelectedWeekDate(startOfISOWeek(new Date(year, 0, 4 + (weekNum - 1) * 7)))
      }
    } else {
      setSelectedWeekDate(undefined)
    }
    setDialogOpen(true)
  }

  function handleTypeChange(type: 'annuel' | 'mensuel' | 'hebdo') {
    setFormType(type)
    if (type === 'annuel') setFormPeriod('2026')
    else if (type === 'mensuel') setFormPeriod('2026-10')
    else { setSelectedWeekDate(undefined); setFormPeriod('') }
  }

  function handleWeekDateSelect(date: Date | undefined) {
    if (!date) return
    setSelectedWeekDate(date)
    setFormPeriod(getWeekFromDate(date))
  }

  function saveObjective() {
    if (!formTitle.trim() || !formPeriod) return
    if (editingObj) {
      onObjectivesChange(objectives.map((o) =>
        o.id === editingObj.id
          ? { ...o, title: formTitle.trim(), subtitle: formSubtitle.trim(), type: formType, category: formCategory, period: formPeriod }
          : o
      ))
    } else {
      onObjectivesChange([
        ...objectives,
        {
          id: Date.now().toString(),
          title: formTitle.trim(),
          subtitle: formSubtitle.trim(),
          type: formType,
          category: formCategory,
          period: formPeriod,
          done: false,
        },
      ])
    }
    setDialogOpen(false)
    setEditingObj(null)
  }

  function toggleDone(id: string) {
    onObjectivesChange(objectives.map((o) => (o.id === id ? { ...o, done: !o.done } : o)))
  }

  function removeObjective(id: string) {
    onObjectivesChange(objectives.filter((o) => o.id !== id))
  }

  function getLinkedTasks(objId: string): Task[] {
    return tasks.filter((t) => (t.objectiveIds || []).includes(objId))
  }

  const annual = objectives.filter((o) => o.type === 'annuel').sort((a, b) => a.period.localeCompare(b.period))
  const monthly = objectives.filter((o) => o.type === 'mensuel').sort((a, b) => a.period.localeCompare(b.period))
  const weekly = objectives.filter((o) => o.type === 'hebdo').sort((a, b) => a.period.localeCompare(b.period))

  // Shared form dialog
  const formDialog = (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#241f20]">{editingObj ? 'Modifier l\'objectif' : 'Nouvel objectif'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <Input placeholder="Titre de l'objectif" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="rounded-xl" />
          <Input placeholder="Sous-titre / description courte" value={formSubtitle} onChange={(e) => setFormSubtitle(e.target.value)} className="rounded-xl" />

          <div>
            <label className="text-xs text-[#6c6560] mb-2 block">Catégorie</label>
            <div className="flex flex-wrap gap-1.5">
              {OBJECTIVE_CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => setFormCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                    formCategory === cat ? CATEGORY_COLORS[cat] : 'bg-[#f5f5f7] text-[#6c6560] hover:bg-[#eee]'
                  }`}>{cat}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-[#6c6560] mb-2 block">Type d'objectif</label>
            <div className="flex gap-2">
              {([
                { value: 'annuel' as const, label: 'Annuel', icon: <Star className="h-3.5 w-3.5" /> },
                { value: 'mensuel' as const, label: 'Mensuel', icon: <CalendarDays className="h-3.5 w-3.5" /> },
                { value: 'hebdo' as const, label: 'Hebdomadaire', icon: <CalendarClock className="h-3.5 w-3.5" /> },
              ]).map((t) => (
                <button key={t.value} onClick={() => handleTypeChange(t.value)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm transition-all ${
                    formType === t.value ? 'bg-[#241f20] text-white' : 'bg-[#f5f5f7] text-[#6c6560] hover:bg-[#eee]'
                  }`}>{t.icon} {t.label}</button>
              ))}
            </div>
          </div>

          {formType === 'annuel' ? (
            <Select value={formPeriod} onValueChange={setFormPeriod}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2026">2026</SelectItem>
                <SelectItem value="2027">2027</SelectItem>
              </SelectContent>
            </Select>
          ) : formType === 'mensuel' ? (
            <Select value={formPeriod} onValueChange={setFormPeriod}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => {
                  const val = `2026-${(i + 1).toString().padStart(2, '0')}`
                  return <SelectItem key={val} value={val}>{MONTHS[i]} 2026</SelectItem>
                })}
              </SelectContent>
            </Select>
          ) : (
            <div className="space-y-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left rounded-xl h-10 font-normal">
                    <CalendarIcon className="h-4 w-4 mr-2 text-[#a39c95]" />
                    {selectedWeekDate ? (
                      <span className="text-[#241f20]">{getWeekRangeFromDate(selectedWeekDate)}</span>
                    ) : (
                      <span className="text-[#a39c95]">Choisir une date pour sélectionner la semaine</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                  <Calendar mode="single" selected={selectedWeekDate} onSelect={handleWeekDateSelect} locale={fr} defaultMonth={new Date()} />
                </PopoverContent>
              </Popover>
              {selectedWeekDate && (
                <p className="text-xs text-[#6c6560] bg-[#f5f5f7] rounded-lg px-3 py-2">{getWeekRangeFromDate(selectedWeekDate)}</p>
              )}
            </div>
          )}

          <Button onClick={saveObjective} disabled={!formTitle.trim() || !formPeriod}
            className="w-full rounded-full bg-[#f8571f] hover:bg-[#e04d1a] text-white">
            {editingObj ? 'Enregistrer' : 'Ajouter'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )

  return (
    <div className="space-y-8">
      {formDialog}

      {/* Hero Progress Card */}
      <Card className="p-8 relative overflow-hidden border-0 shadow-[0_10px_50px_-12px_rgba(248,87,31,0.2)]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#f8571f]/5 via-transparent to-[#a7abdd]/8" />
        <div className="relative">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-[#241f20] flex items-center justify-center shadow-lg">
              <Trophy className="h-7 w-7 text-[#f8571f]" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-[#241f20] tracking-tight">Objectif 2026</h2>
              <p className="text-[#6c6560] text-sm">100 clients actifs d'ici fin décembre</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div className="flex items-baseline gap-2">
                {editingCount ? (
                  <Input type="number" className="w-24 h-12 text-2xl font-bold rounded-xl" value={clientCount}
                    onChange={(e) => onClientCountChange(parseInt(e.target.value) || 0)}
                    onBlur={() => setEditingCount(false)}
                    onKeyDown={(e) => e.key === 'Enter' && setEditingCount(false)} autoFocus />
                ) : (
                  <span className="text-6xl font-bold text-[#f8571f] cursor-pointer hover:opacity-80 transition-opacity leading-none"
                    onClick={() => setEditingCount(true)}>{clientCount}</span>
                )}
                <span className="text-xl text-[#a39c95] font-light">/ {target} clients</span>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold text-[#241f20]">{pct}%</span>
                <p className="text-xs text-[#a39c95]">complété</p>
              </div>
            </div>
            <div className="relative pt-1">
              <div className="h-6 bg-[#f5f5f7] rounded-full overflow-hidden relative shadow-inner">
                <div className="h-full rounded-full transition-all duration-700 ease-out relative"
                  style={{ width: `${Math.max(pct, 2)}%`, background: 'linear-gradient(115deg, #f8571f 0%, #ff7b4f 40%, #accce9 80%, #a7abdd 100%)' }}>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/25 to-transparent" />
                </div>
                {milestones.map((m) => (
                  <div key={m.value} className="absolute top-0 bottom-0" style={{ left: `${m.value}%` }}>
                    <div className={`w-0.5 h-full ${pct >= m.value ? 'bg-white/40' : 'bg-[#241f20]/10'}`} />
                  </div>
                ))}
              </div>
              <div className="relative mt-1.5 flex justify-between text-[10px] text-[#a39c95] px-0.5">
                <span>0</span>
                {milestones.map((m) => (
                  <span key={m.value} className={pct >= m.value ? 'text-[#f8571f] font-medium' : ''}
                    style={{ position: 'absolute', left: `${m.value}%`, transform: 'translateX(-50%)' }}>{m.label}</span>
                ))}
                <span>100</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Add button */}
      <div className="flex justify-end">
        <Button size="sm" onClick={openCreateDialog} className="rounded-full bg-[#241f20] hover:bg-[#333] text-white">
          <Plus className="h-4 w-4 mr-1" /> Nouvel objectif
        </Button>
      </div>

      {/* Annual */}
      {annual.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold flex items-center gap-2 text-[#241f20] mb-4">
            <Star className="h-5 w-5 text-[#f8571f]" /> Objectifs annuels
          </h3>
          <div className="grid gap-3">
            {annual.map((obj) => (
              <ObjectiveCard key={obj.id} obj={obj} linkedTasks={getLinkedTasks(obj.id)}
                onToggle={toggleDone} onRemove={removeObjective} onEdit={openEditDialog} onTaskClick={onTaskClick} />
            ))}
          </div>
        </section>
      )}

      {/* Monthly */}
      <section>
        <h3 className="text-lg font-semibold flex items-center gap-2 text-[#241f20] mb-4">
          <CalendarDays className="h-5 w-5 text-[#f8571f]" /> Objectifs mensuels
        </h3>
        {monthly.length === 0 ? (
          <p className="text-sm text-[#a39c95] text-center py-4">Aucun objectif mensuel</p>
        ) : (
          <div className="grid gap-3">
            {monthly.map((obj) => (
              <ObjectiveCard key={obj.id} obj={obj} linkedTasks={getLinkedTasks(obj.id)}
                onToggle={toggleDone} onRemove={removeObjective} onEdit={openEditDialog} onTaskClick={onTaskClick} />
            ))}
          </div>
        )}
      </section>

      {/* Weekly */}
      <section>
        <h3 className="text-lg font-semibold flex items-center gap-2 text-[#241f20] mb-4">
          <CalendarClock className="h-5 w-5 text-[#accce9]" /> Objectifs hebdomadaires
        </h3>
        {weekly.length === 0 ? (
          <p className="text-sm text-[#a39c95] text-center py-4">Aucun objectif hebdomadaire</p>
        ) : (
          <div className="grid gap-3">
            {weekly.map((obj) => (
              <ObjectiveCard key={obj.id} obj={obj} linkedTasks={getLinkedTasks(obj.id)}
                onToggle={toggleDone} onRemove={removeObjective} onEdit={openEditDialog} onTaskClick={onTaskClick} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function ObjectiveCard({ obj, linkedTasks, onToggle, onRemove, onEdit, onTaskClick }: {
  obj: Objective; linkedTasks: Task[]; onToggle: (id: string) => void; onRemove: (id: string) => void;
  onEdit: (obj: Objective) => void; onTaskClick: (task: Task) => void
}) {
  const isAnnual = obj.type === 'annuel'
  const isMonthly = obj.type === 'mensuel'
  let periodMain = ''
  let periodSub = ''

  if (isAnnual) {
    periodMain = obj.period
    periodSub = ''
  } else if (isMonthly) {
    const [y, m] = obj.period.split('-')
    periodMain = MONTHS[parseInt(m) - 1]?.slice(0, 3) || ''
    periodSub = y
  } else {
    const week = formatWeekLabel(obj.period)
    periodMain = week.short
    periodSub = week.detail
  }

  const STATUS_COLORS_TASK: Record<string, string> = {
    a_faire: '#a39c95', en_cours: '#f8571f', termine: '#a7abdd', bloque: '#ef4444',
  }

  return (
    <Card className={`rounded-2xl border-0 overflow-hidden transition-all hover:shadow-md ${
      obj.done ? 'opacity-50 shadow-sm' : isAnnual ? 'shadow-[0_4px_20px_-4px_rgba(248,87,31,0.15)]' : 'shadow-sm'
    }`}>
      <div className="flex">
        {/* Period badge */}
        <div className={`${isMonthly ? 'w-20' : isAnnual ? 'w-24' : 'w-28'} shrink-0 flex flex-col items-center justify-center py-4 px-2 ${
          obj.done ? 'bg-[#a7abdd]/10'
            : isAnnual ? 'bg-gradient-to-b from-[#f8571f]/10 to-[#a7abdd]/10'
            : isMonthly ? 'bg-gradient-to-b from-[#f8571f]/8 to-[#a7abdd]/8'
            : 'bg-gradient-to-b from-[#accce9]/15 to-[#a7abdd]/8'
        }`}>
          {isAnnual && <Star className={`h-5 w-5 mb-1 ${obj.done ? 'text-[#a39c95]' : 'text-[#f8571f]'}`} />}
          <span className={`text-lg font-bold ${obj.done ? 'text-[#a39c95]' : 'text-[#241f20]'}`}>{periodMain}</span>
          {periodSub && <span className="text-[9px] text-[#a39c95] text-center leading-tight">{periodSub}</span>}
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          <div className="flex items-center gap-3">
            <button onClick={() => onToggle(obj.id)} className="shrink-0">
              {obj.done ? <CheckCircle2 className={`${isAnnual ? 'h-7 w-7' : 'h-6 w-6'} text-[#f8571f]`} />
                : <Circle className={`${isAnnual ? 'h-7 w-7' : 'h-6 w-6'} text-[#a39c95] hover:text-[#f8571f] transition-colors`} />}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold ${isAnnual ? 'text-base' : 'text-[15px]'} ${obj.done ? 'line-through text-[#a39c95]' : 'text-[#241f20]'}`}>
                {obj.title}
              </p>
              {obj.subtitle && <p className={`text-sm mt-0.5 ${obj.done ? 'text-[#a39c95]' : 'text-[#6c6560]'}`}>{obj.subtitle}</p>}
            </div>
            <Badge className={`rounded-full text-[10px] border-0 shrink-0 ${CATEGORY_COLORS[obj.category || 'Global']}`}>
              {obj.category || 'Global'}
            </Badge>
            <button onClick={() => onEdit(obj)} className="text-[#a39c95] hover:text-[#241f20] transition-colors shrink-0" title="Modifier">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => onRemove(obj.id)} className="text-[#a39c95] hover:text-[#ef4444] text-lg transition-colors shrink-0">&times;</button>
          </div>

          {/* Linked tasks */}
          {linkedTasks.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[rgba(36,31,32,0.06)]">
              <p className="text-[10px] uppercase tracking-wider text-[#a39c95] font-medium mb-1.5 flex items-center gap-1">
                <ListTodo className="h-3 w-3" /> Tâches liées
              </p>
              <div className="space-y-1">
                {linkedTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => onTaskClick(task)}
                    className="w-full flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-[#f5f5f7] transition-colors text-left"
                  >
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS_TASK[task.status] || '#a39c95' }} />
                    <span className="text-sm text-[#241f20] truncate flex-1">{task.title}</span>
                    <span className="text-[10px] text-[#a39c95] font-mono shrink-0">{task.dueDate.slice(5)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

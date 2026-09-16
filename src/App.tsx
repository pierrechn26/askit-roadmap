import { useState, useEffect, useCallback, useRef } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ObjectivePanel } from '@/components/ObjectivePanel'
import { TaskTable } from '@/components/TaskTable'
import { GanttView } from '@/components/GanttView'
import { TeamSettings } from '@/components/TeamSettings'
import { TaskDetailPanel } from '@/components/TaskDetailPanel'
import { LoginPage } from '@/components/LoginPage'
import { InviteUser } from '@/components/InviteUser'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { DEFAULT_MEMBERS, DEFAULT_TASKS, DEFAULT_OBJECTIVES } from '@/data/defaults'
import { CrmPanel } from '@/components/CrmPanel'
import { LayoutDashboard, ListTodo, GanttChart, Users, Briefcase, LogOut } from 'lucide-react'
import type { Task, Objective, TeamMember } from '@/types'
import type { CrmDeal } from '@/types/crm'
import { DEFAULT_DEALS } from '@/data/crm-defaults'

interface AuthUser {
  id: number
  name: string
  email: string
  role: string
}

// Helper: sync full array to API (debounced via PUT with array body)
function syncToApi(endpoint: string, data: unknown) {
  fetch(endpoint, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).catch((err) => console.error(`Sync error (${endpoint}):`, err))
}

function App() {
  const [authToken, setAuthToken] = useLocalStorage<string | null>('askit-auth-token', null)
  const [authUser, setAuthUser] = useLocalStorage<AuthUser | null>('askit-auth-user', null)
  const [authChecked, setAuthChecked] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)

  const [clientCount, setClientCountLocal] = useState(10)
  const [tasks, setTasksLocal] = useState<Task[]>([])
  const [objectives, setObjectivesLocal] = useState<Objective[]>([])
  const [members, setMembersLocal] = useState<TeamMember[]>(DEFAULT_MEMBERS)
  const [deals, setDealsLocal] = useState<CrmDeal[]>([])

  // Debounce refs for syncing
  const syncTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  function debouncedSync(key: string, endpoint: string, data: unknown, delay = 500) {
    if (syncTimers.current[key]) clearTimeout(syncTimers.current[key])
    syncTimers.current[key] = setTimeout(() => syncToApi(endpoint, data), delay)
  }

  // Wrapped setters that do optimistic update + API sync
  const setTasks = useCallback((valueOrFn: Task[] | ((prev: Task[]) => Task[])) => {
    setTasksLocal((prev) => {
      const next = typeof valueOrFn === 'function' ? valueOrFn(prev) : valueOrFn
      debouncedSync('tasks', '/api/data/tasks', next)
      return next
    })
  }, [])

  const setObjectives = useCallback((valueOrFn: Objective[] | ((prev: Objective[]) => Objective[])) => {
    setObjectivesLocal((prev) => {
      const next = typeof valueOrFn === 'function' ? valueOrFn(prev) : valueOrFn
      debouncedSync('objectives', '/api/data/objectives', next)
      return next
    })
  }, [])

  const setMembers = useCallback((valueOrFn: TeamMember[] | ((prev: TeamMember[]) => TeamMember[])) => {
    setMembersLocal((prev) => {
      const next = typeof valueOrFn === 'function' ? valueOrFn(prev) : valueOrFn
      debouncedSync('members', '/api/data/members', next)
      return next
    })
  }, [])

  const setDeals = useCallback((valueOrFn: CrmDeal[] | ((prev: CrmDeal[]) => CrmDeal[])) => {
    setDealsLocal((prev) => {
      const next = typeof valueOrFn === 'function' ? valueOrFn(prev) : valueOrFn
      debouncedSync('deals', '/api/data/deals', next)
      return next
    })
  }, [])

  const setClientCount = useCallback((value: number) => {
    setClientCountLocal(value)
    fetch('/api/data/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'clientCount', value }),
    }).catch((err) => console.error('Settings sync error:', err))
  }, [])

  // Load all data from API on mount
  useEffect(() => {
    if (!authToken) return

    let cancelled = false

    async function loadData() {
      try {
        const [tasksRes, objectivesRes, dealsRes, membersRes, settingsRes] = await Promise.all([
          fetch('/api/data/tasks').then((r) => r.json()).catch(() => ({ tasks: [] })),
          fetch('/api/data/objectives').then((r) => r.json()).catch(() => ({ objectives: [] })),
          fetch('/api/data/deals').then((r) => r.json()).catch(() => ({ deals: [] })),
          fetch('/api/data/members').then((r) => r.json()).catch(() => ({ members: [] })),
          fetch('/api/data/settings').then((r) => r.json()).catch(() => ({ settings: {} })),
        ])

        if (cancelled) return

        // If DB is empty, seed with defaults and push to API
        const dbTasks = tasksRes.tasks?.length > 0 ? tasksRes.tasks : DEFAULT_TASKS
        const dbObjectives = objectivesRes.objectives?.length > 0 ? objectivesRes.objectives : DEFAULT_OBJECTIVES
        const dbDeals = dealsRes.deals?.length > 0 ? dealsRes.deals : DEFAULT_DEALS
        const dbMembers = membersRes.members?.length > 0 ? membersRes.members : DEFAULT_MEMBERS
        const dbClientCount = settingsRes.settings?.clientCount != null ? Number(settingsRes.settings.clientCount) : 10

        setTasksLocal(dbTasks)
        setObjectivesLocal(dbObjectives)
        setDealsLocal(dbDeals)
        setMembersLocal(dbMembers)
        setClientCountLocal(dbClientCount)

        // If DB was empty, push defaults to API
        if (!tasksRes.tasks?.length) syncToApi('/api/data/tasks', DEFAULT_TASKS)
        if (!objectivesRes.objectives?.length) syncToApi('/api/data/objectives', DEFAULT_OBJECTIVES)
        if (!dealsRes.deals?.length) syncToApi('/api/data/deals', DEFAULT_DEALS)
        if (!membersRes.members?.length) syncToApi('/api/data/members', DEFAULT_MEMBERS)
        if (settingsRes.settings?.clientCount == null) {
          fetch('/api/data/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'clientCount', value: 10 }),
          }).catch(() => {})
        }

        setDataLoaded(true)
      } catch (err) {
        console.error('Failed to load data from API, using defaults:', err)
        if (cancelled) return
        setTasksLocal(DEFAULT_TASKS)
        setObjectivesLocal(DEFAULT_OBJECTIVES)
        setDealsLocal(DEFAULT_DEALS)
        setMembersLocal(DEFAULT_MEMBERS)
        setClientCountLocal(10)
        setDataLoaded(true)
      }
    }

    loadData()
    return () => { cancelled = true }
  }, [authToken])

  // Verify token on load
  useEffect(() => {
    if (!authToken) { setAuthChecked(true); return }
    try {
      const base64Part = authToken.split('.')[0]
      const data = JSON.parse(atob(base64Part))
      if (data.exp < Date.now()) {
        setAuthToken(null); setAuthUser(null)
      }
    } catch {
      setAuthToken(null); setAuthUser(null)
    }
    setAuthChecked(true)
  }, [])

  // Auto-sync member colors + sync invited users into team members
  useEffect(() => {
    if (!dataLoaded) return

    const colorMap: Record<string, string> = {}
    DEFAULT_MEMBERS.forEach((m) => { colorMap[m.name] = m.color })
    let updated = members.map((m) => colorMap[m.name] ? { ...m, color: colorMap[m.name] } : m)

    fetch('/api/auth/list-users')
      .then((r) => r.json())
      .then((data) => {
        if (!data.users) return
        const existingNames = new Set(updated.map((m) => m.name.toLowerCase()))
        const COLORS = ['#f8571f', '#10b981', '#6366f1', '#ec4899', '#06b6d4', '#f59e0b', '#8b5cf6', '#84cc16']
        let changed = false
        for (const u of data.users) {
          if (!existingNames.has(u.name.toLowerCase())) {
            updated = [...updated, {
              name: u.name,
              email: u.email,
              color: COLORS[updated.length % COLORS.length],
              role: u.role === 'dev' ? 'dev' as const : 'general' as const,
            }]
            changed = true
          }
        }
        for (const u of data.users) {
          const idx = updated.findIndex((m) => m.name.toLowerCase() === u.name.toLowerCase())
          if (idx >= 0 && !updated[idx].email && u.email) {
            updated = updated.map((m, i) => i === idx ? { ...m, email: u.email } : m)
            changed = true
          }
        }
        if (changed || members.some((m, i) => m.color !== updated[i]?.color)) {
          setMembers(updated)
        }
      })
      .catch(() => {
        if (members.some((m) => colorMap[m.name] && m.color !== colorMap[m.name])) {
          setMembers(updated)
        }
      })
  }, [dataLoaded])

  // Auto-migrate tasks
  useEffect(() => {
    if (!dataLoaded || tasks.length === 0) return
    const needsMigration = tasks.some((t) => !t.taskType || (t.assignees.includes('Bastien') && t.taskType !== 'ticket'))
    if (needsMigration) {
      setTasks(tasks.map((t) => ({
        ...t,
        taskType: t.assignees.includes('Bastien') ? 'ticket' : (t.taskType || 'roadmap'),
        client: t.client || '',
      })))
    }
  }, [dataLoaded])

  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const urlParams = new URLSearchParams(window.location.search)
  const initialTab = urlParams.get('tab') || 'roadmap'
  const [activeTab, setActiveTab] = useState(initialTab)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const taskId = params.get('task')
    if (taskId && tasks.length > 0) {
      const found = tasks.find((t) => t.id === taskId)
      if (found) {
        setActiveTab('tasks')
        setSelectedTask(found)
        setDetailOpen(true)
        window.history.replaceState({}, '', window.location.pathname)
      }
    }
  }, [tasks])

  function handleTaskClick(task: Task) {
    const latest = tasks.find((t) => t.id === task.id) || task
    setSelectedTask(latest)
    setDetailOpen(true)
  }

  function handleTaskUpdate(updated: Task) {
    setTasks(tasks.map((t) => (t.id === updated.id ? updated : t)))
    setSelectedTask(updated)
  }

  function handleLogin(token: string, user: AuthUser) {
    setAuthToken(token)
    setAuthUser(user)
  }

  function handleLogout() {
    setAuthToken(null)
    setAuthUser(null)
  }

  // Show loading while checking auth
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#fdfcfc] flex items-center justify-center">
        <div className="text-[#a39c95]">Chargement...</div>
      </div>
    )
  }

  // Show login if not authenticated
  if (!authToken || !authUser) {
    return <LoginPage onLogin={handleLogin} />
  }

  // Show loading while fetching data from DB
  if (!dataLoaded) {
    return (
      <div className="min-h-screen bg-[#fdfcfc] flex items-center justify-center">
        <div className="text-[#a39c95]">Chargement des donnees...</div>
      </div>
    )
  }

  const isAdmin = authUser.role === 'admin'

  return (
    <div className="min-h-screen bg-[#fdfcfc]">
      {/* Header */}
      <header className="bg-white border-b border-[rgba(36,31,32,0.08)]">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="flex items-baseline">
              <span className="text-[22px] font-bold tracking-tight text-[#241f20]">ask-it</span>
              <span className="text-[22px] font-light text-[#241f20]/40">.ai</span>
            </div>
            <div className="w-px h-5 bg-[#241f20]/10" />
            <div>
              <h1 className="text-[15px] font-medium text-[#241f20] tracking-tight leading-tight">Roadmap 2026</h1>
              <p className="text-[12px] text-[#a39c95]">Suivi des objectifs et tâches de l'équipe</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[13px] font-medium text-[#241f20]">{authUser.name}</p>
              <p className="text-[11px] text-[#a39c95]">{authUser.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-[#f5f5f7] text-[#a39c95] hover:text-[#241f20] transition-colors"
              title="Se déconnecter"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6">
          <div className="h-[2px] bg-gradient-to-r from-[#f8571f] via-[#accce9] to-[#a7abdd]" />
        </div>
      </header>

      {/* Main */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Tab nav — sticky, full width */}
        <div className="border-b border-[rgba(36,31,32,0.08)] bg-white sticky top-0 z-20 w-full">
          <div className="max-w-6xl mx-auto px-6">
            <TabsList className="bg-transparent p-0 h-auto gap-0 border-0 justify-start w-full rounded-none">
              {[
                { value: 'roadmap', label: 'Roadmap', icon: <LayoutDashboard className="h-4 w-4" /> },
                { value: 'tasks', label: 'Tâches', icon: <ListTodo className="h-4 w-4" /> },
                { value: 'gantt', label: 'Timeline', icon: <GanttChart className="h-4 w-4" /> },
                { value: 'team', label: 'Équipe', icon: <Users className="h-4 w-4" /> },
                { value: 'crm', label: 'CRM', icon: <Briefcase className="h-4 w-4" /> },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="relative gap-2 px-5 py-3.5 rounded-none text-[14px] font-medium
                    text-[#a39c95] hover:text-[#241f20] transition-colors
                    data-[state=active]:text-[#241f20] data-[state=active]:bg-transparent
                    data-[state=active]:shadow-none
                    data-[state=active]:after:absolute data-[state=active]:after:bottom-0
                    data-[state=active]:after:left-0 data-[state=active]:after:right-0
                    data-[state=active]:after:h-[2px] data-[state=active]:after:bg-[#f8571f]
                    data-[state=active]:after:rounded-full
                    border-0"
                >
                  {tab.icon} {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>

        {/* Tab content */}
        <main className="max-w-6xl mx-auto px-6 pt-6 pb-10 w-full">
            <TabsContent value="roadmap" className="mt-0">
              <ObjectivePanel
                clientCount={clientCount}
                onClientCountChange={setClientCount}
                objectives={objectives}
                onObjectivesChange={setObjectives}
                tasks={tasks}
                onTasksChange={setTasks}
                onTaskClick={handleTaskClick}
              />
            </TabsContent>

            <TabsContent value="tasks" className="mt-0">
              <TaskTable tasks={tasks} onTasksChange={setTasks} members={members} objectives={objectives} onTaskClick={handleTaskClick} />
            </TabsContent>

            <TabsContent value="gantt" className="mt-0">
              <GanttView tasks={tasks} members={members} onTaskClick={handleTaskClick} />
            </TabsContent>

            <TabsContent value="crm" className="mt-0">
              <CrmPanel deals={deals} onDealsChange={setDeals} />
            </TabsContent>

            <TabsContent value="team" className="mt-0">
              <div className="max-w-md space-y-6">
                <TeamSettings members={members} onMembersChange={setMembers} />
                {isAdmin && <InviteUser currentUserEmail={authUser.email} />}
              </div>
            </TabsContent>
        </main>
      </Tabs>

      <TaskDetailPanel
        task={selectedTask}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onTaskUpdate={handleTaskUpdate}
        members={members}
        objectives={objectives}
      />
    </div>
  )
}

export default App

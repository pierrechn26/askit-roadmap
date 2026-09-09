import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ObjectivePanel } from '@/components/ObjectivePanel'
import { TaskTable } from '@/components/TaskTable'
import { GanttView } from '@/components/GanttView'
import { TeamSettings } from '@/components/TeamSettings'
import { TaskDetailPanel } from '@/components/TaskDetailPanel'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { DEFAULT_MEMBERS, DEFAULT_TASKS, DEFAULT_OBJECTIVES } from '@/data/defaults'
import { LayoutDashboard, ListTodo, GanttChart, Settings } from 'lucide-react'
import type { Task, Objective, TeamMember } from '@/types'

function App() {
  const [clientCount, setClientCount] = useLocalStorage('askit-clients', 10)
  const [tasks, setTasks] = useLocalStorage<Task[]>('askit-tasks', DEFAULT_TASKS)
  const [objectives, setObjectives] = useLocalStorage<Objective[]>('askit-objectives', DEFAULT_OBJECTIVES)
  const [members, setMembers] = useLocalStorage<TeamMember[]>('askit-members', DEFAULT_MEMBERS)

  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  function handleTaskClick(task: Task) {
    // Get latest version from state
    const latest = tasks.find((t) => t.id === task.id) || task
    setSelectedTask(latest)
    setDetailOpen(true)
  }

  function handleTaskUpdate(updated: Task) {
    setTasks(tasks.map((t) => (t.id === updated.id ? updated : t)))
    setSelectedTask(updated)
  }

  return (
    <div className="min-h-screen bg-[#fdfcfc]">
      {/* Header with brand gradient */}
      <header className="bg-[#241f20] text-white px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-baseline">
              <span className="text-xl font-semibold tracking-tight">ask-it</span>
              <span className="text-xl font-light text-white/60">.ai</span>
            </div>
            <div className="w-px h-6 bg-white/20" />
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Roadmap 2026</h1>
              <p className="text-xs text-white/50">Suivi des objectifs et tâches de l'équipe</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-white/40">Aujourd'hui</span>
            <p className="text-sm font-medium text-white/80">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-4">
          <div className="h-0.5 rounded-full bg-gradient-to-r from-[#f8571f] via-[#accce9] to-[#a7abdd]" />
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto p-6">
        <Tabs defaultValue="roadmap">
          <TabsList className="mb-6 bg-[#f5f5f7] rounded-full p-1">
            <TabsTrigger
              value="roadmap"
              className="gap-1.5 rounded-full data-[state=active]:bg-[#241f20] data-[state=active]:text-white"
            >
              <LayoutDashboard className="h-4 w-4" /> Roadmap
            </TabsTrigger>
            <TabsTrigger
              value="tasks"
              className="gap-1.5 rounded-full data-[state=active]:bg-[#241f20] data-[state=active]:text-white"
            >
              <ListTodo className="h-4 w-4" /> Tâches
            </TabsTrigger>
            <TabsTrigger
              value="gantt"
              className="gap-1.5 rounded-full data-[state=active]:bg-[#241f20] data-[state=active]:text-white"
            >
              <GanttChart className="h-4 w-4" /> Timeline
            </TabsTrigger>
            <TabsTrigger
              value="team"
              className="gap-1.5 rounded-full data-[state=active]:bg-[#241f20] data-[state=active]:text-white"
            >
              <Settings className="h-4 w-4" /> Équipe
            </TabsTrigger>
          </TabsList>

          <TabsContent value="roadmap">
            <ObjectivePanel
              clientCount={clientCount}
              onClientCountChange={setClientCount}
              objectives={objectives}
              onObjectivesChange={setObjectives}
            />
          </TabsContent>

          <TabsContent value="tasks">
            <TaskTable
              tasks={tasks}
              onTasksChange={setTasks}
              members={members}
              onTaskClick={handleTaskClick}
            />
          </TabsContent>

          <TabsContent value="gantt">
            <GanttView
              tasks={tasks}
              members={members}
              onTaskClick={handleTaskClick}
            />
          </TabsContent>

          <TabsContent value="team">
            <div className="max-w-md">
              <TeamSettings members={members} onMembersChange={setMembers} />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Task detail panel */}
      <TaskDetailPanel
        task={selectedTask}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onTaskUpdate={handleTaskUpdate}
        members={members}
      />
    </div>
  )
}

export default App

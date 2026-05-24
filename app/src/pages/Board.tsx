import { useEffect, useState } from 'react'
import { listProjects, type Project } from '../services/projectsService'
import { listContractors, type Contractor } from '../services/contractorsService'
import { listTasksByProject, subscribeToTaskChanges, type Task, type TaskChangeEvent } from '../services/tasksService'
import { TaskCard } from './TaskCard'
import './Board.css'

const COLUMNS = [
  { status: 'ideation',    label: 'Ideation'    },
  { status: 'planned',     label: 'Planned'     },
  { status: 'ready',       label: 'Ready'       },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'done',        label: 'Done'        },
] as const

type TasksResult =
  | { status: 'ready'; projectId: string; items: Task[] }
  | { status: 'error'; message: string }

function applyTaskChange(items: Task[], event: TaskChangeEvent): Task[] {
  if (event.eventType === 'INSERT') {
    return event.record.status === 'discarded' ? items : [...items, event.record]
  }
  if (event.eventType === 'UPDATE') {
    return items
      .map((t) => (t.id === event.record.id ? event.record : t))
      .filter((t) => t.status !== 'discarded')
  }
  return items.filter((t) => t.id !== event.id)
}

export function Board() {
  const [projects, setProjects]       = useState<Project[]>([])
  const [selectedId, setSelectedId]   = useState('')
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [projectsError, setProjectsError]     = useState<string | null>(null)
  const [tasksResult, setTasksResult] = useState<TasksResult | null>(null)

  // Derived task state — no synchronous setState needed in effects
  const tasksLoading = tasksResult === null ||
    (tasksResult.status === 'ready' && tasksResult.projectId !== selectedId)
  const tasksError   = tasksResult?.status === 'error' ? tasksResult.message : null
  const tasks        = tasksResult?.status === 'ready' && tasksResult.projectId === selectedId
    ? tasksResult.items
    : []

  useEffect(() => {
    listProjects()
      .then((data) => {
        setProjects(data)
        if (data.length > 0) setSelectedId(data[0].id)
      })
      .catch(() => setProjectsError('Failed to load projects'))
      .finally(() => setProjectsLoading(false))

    listContractors().then(setContractors).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedId) return

    listTasksByProject(selectedId)
      .then((data) => setTasksResult({
        status: 'ready',
        projectId: selectedId,
        items: data.filter((t) => t.status !== 'discarded'),
      }))
      .catch(() => setTasksResult({ status: 'error', message: 'Failed to load tasks' }))

    return subscribeToTaskChanges(selectedId, (event) =>
      setTasksResult((prev) => {
        if (prev?.status !== 'ready' || prev.projectId !== selectedId) return prev
        return { ...prev, items: applyTaskChange(prev.items, event) }
      })
    )
  }, [selectedId])

  if (projectsLoading) return <p className="board-message">Loading…</p>
  if (projectsError)   return <p className="board-message board-message--error">{projectsError}</p>

  const contractorName = (id: string | null) =>
    id ? (contractors.find((c) => c.id === id)?.name ?? null) : null

  return (
    <div className="board">
      <div className="board-toolbar">
        <select
          className="input board-select"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          aria-label="Select project"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        {tasksError && <p className="board-message board-message--error">{tasksError}</p>}
      </div>

      <div className="board-columns">
        {COLUMNS.map(({ status, label }) => {
          const colTasks = tasks.filter((t) => t.status === status)
          return (
            <div key={status} className="board-column">
              <span className="eyebrow">{label}</span>
              <div className="board-column-body">
                {tasksLoading ? (
                  <p className="board-column-empty">Loading…</p>
                ) : colTasks.length === 0 ? (
                  <p className="board-column-empty">No tasks</p>
                ) : (
                  colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      contractorName={contractorName(task.contractor_id)}
                      onSelect={() => {}}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGear, faPlus } from '@fortawesome/free-solid-svg-icons'
import { listProjects, type Project } from '../services/projectsService'
import { listContractors, type Contractor } from '../services/contractorsService'
import { listTasksByProject, subscribeToTaskChanges, updateTask, buildStatusTransition, type Task, type TaskChangeEvent } from '../services/tasksService'
import { TaskCard } from './TaskCard'
import { TaskDetail } from './TaskDetail'
import { TaskForm } from './TaskForm'
import { Settings } from './Settings'
import './Board.css'

const COLUMNS = [
  { status: 'ideation',    label: 'Ideation'    },
  { status: 'planned',     label: 'Planned'     },
  { status: 'ready',       label: 'Ready'       },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'done',        label: 'Done'        },
] as const

const STATUSES = COLUMNS.map((c) => c.status)

type View =
  | { kind: 'board' }
  | { kind: 'detail'; task: Task }
  | { kind: 'form'; task?: Task }
  | { kind: 'settings' }

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
  const [tasksResult, setTasksResult]     = useState<TasksResult | null>(null)
  const [view, setView]                   = useState<View>({ kind: 'board' })
  const [transitionError, setTransitionError] = useState<string | null>(null)

  const tasksLoading = tasksResult === null ||
    (tasksResult.status === 'ready' && tasksResult.projectId !== selectedId)
  const tasksError   = tasksResult?.status === 'error' ? tasksResult.message : null
  const tasks        = tasksResult?.status === 'ready' && tasksResult.projectId === selectedId
    ? tasksResult.items
    : []

  function loadContractors() {
    listContractors().then(setContractors).catch(() => {})
  }

  useEffect(() => {
    listProjects()
      .then((data) => {
        setProjects(data)
        if (data.length > 0) setSelectedId(data[0].id)
      })
      .catch(() => setProjectsError('Failed to load projects'))
      .finally(() => setProjectsLoading(false))

    loadContractors()
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

  function handleStatusChange(task: Task, newStatus: string) {
    setTransitionError(null)
    const update = buildStatusTransition(task, newStatus)
    setTasksResult((prev) => {
      if (prev?.status !== 'ready') return prev
      return { ...prev, items: prev.items.map((t) => t.id === task.id ? { ...t, ...update } : t) }
    })
    updateTask(task.id, update).catch(() => {
      listTasksByProject(selectedId)
        .then((data) => setTasksResult((prev) => {
          if (prev?.status !== 'ready' || prev.projectId !== selectedId) return prev
          return { ...prev, items: data.filter((t) => t.status !== 'discarded') }
        }))
        .catch(() => {})
      const msg = newStatus === 'on_hold'
        ? 'Failed to pause task — refreshed from server'
        : task.status === 'on_hold'
          ? 'Failed to resume task — refreshed from server'
          : 'Failed to move task — refreshed from server'
      setTransitionError(msg)
    })
  }

  if (projectsLoading) return <p className="board-message">Loading…</p>
  if (projectsError)   return <p className="board-message board-message--error">{projectsError}</p>

  const contractorName = (id: string | null) =>
    id ? (contractors.find((c) => c.id === id)?.name ?? null) : null

  if (view.kind === 'settings') {
    return (
      <div className="board">
        <Settings onBack={() => { setView({ kind: 'board' }); loadContractors() }} />
      </div>
    )
  }

  if (view.kind === 'detail') {
    return (
      <div className="board">
        <TaskDetail
          task={view.task}
          contractorName={contractorName(view.task.contractor_id)}
          onBack={() => setView({ kind: 'board' })}
          onEdit={() => setView({ kind: 'form', task: view.task })}
        />
      </div>
    )
  }

  if (view.kind === 'form') {
    const formTask = view.task
    return (
      <div className="board">
        <TaskForm
          task={formTask}
          projectId={selectedId}
          contractors={contractors}
          onBack={() => setView(formTask ? { kind: 'detail', task: formTask } : { kind: 'board' })}
          onSaved={(saved) => setView(formTask ? { kind: 'detail', task: saved } : { kind: 'board' })}
        />
      </div>
    )
  }

  return (
    <div className="board">
      <div className="board-toolbar">
        <div className="board-toolbar-controls">
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
          <div className="board-toolbar-actions">
            <button
              className="btn-outline"
              onClick={() => setView({ kind: 'form' })}
              disabled={!selectedId}
              aria-label="New task"
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
            <button
              className="btn-icon"
              onClick={() => setView({ kind: 'settings' })}
              aria-label="Settings"
            >
              <FontAwesomeIcon icon={faGear} />
            </button>
          </div>
        </div>
        {tasksError && <p className="board-message board-message--error">{tasksError}</p>}
        {transitionError && <p className="board-message board-message--error">{transitionError}</p>}
      </div>

      <div className="board-columns">
        {COLUMNS.map(({ status, label }) => {
          const colTasks = tasks.filter((t) =>
            t.status === status || (status === 'in_progress' && t.status === 'on_hold')
          )
          return (
            <div key={status} className="board-column">
              <span className="eyebrow">{label}</span>
              <div className="board-column-body">
                {tasksLoading ? (
                  <p className="board-column-empty">Loading…</p>
                ) : colTasks.length === 0 ? (
                  <p className="board-column-empty">No tasks</p>
                ) : (
                  colTasks.map((task) => {
                    const isOnHold = task.status === 'on_hold'
                    const idx = isOnHold ? -1 : STATUSES.indexOf(task.status as typeof STATUSES[number])
                    return (
                      <TaskCard
                        key={task.id}
                        task={task}
                        contractorName={contractorName(task.contractor_id)}
                        prevStatus={isOnHold || idx <= 0 ? null : STATUSES[idx - 1]}
                        nextStatus={isOnHold || idx < 0 || idx >= STATUSES.length - 1 ? null : STATUSES[idx + 1]}
                        onSelect={(t) => setView({ kind: 'detail', task: t })}
                        onStatusChange={handleStatusChange}
                      />
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

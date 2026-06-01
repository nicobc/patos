import { useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown, faGear, faPlus, faTrash, faXmark } from '@fortawesome/free-solid-svg-icons'
import { listProjects, subscribeToProjectChanges, type Project, type ProjectChangeEvent } from '../services/projectsService'
import { listContractors, subscribeToContractorChanges, type Contractor } from '../services/contractorsService'
import {
  listTasksByProject,
  listRawDepsByTasks,
  subscribeToTaskChanges,
  subscribeToDepsChanges,
  updateTask,
  buildStatusTransition,
  type Task,
  type TaskChangeEvent,
  type DepChangeEvent,
} from '../services/tasksService'
import { TaskCard } from './TaskCard'
import { TaskDetail } from './TaskDetail'
import { TaskForm } from './TaskForm'
import { Settings } from './Settings'
import { DagView } from './DagView'
import { type RawDep } from '../lib/dagResolver'
import './Board.css'

const STATUS_LABELS: Record<string, string> = {
  ideation: 'Ideation', planned: 'Planned',
  in_progress: 'In Progress', done: 'Done', on_hold: 'On Hold',
}

const COLUMNS = [
  { status: 'ideation',    label: 'Ideation'    },
  { status: 'planned',     label: 'Planned'     },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'done',        label: 'Done'        },
] as const

const STATUSES = COLUMNS.map((c) => c.status)

type View =
  | { kind: 'board'; scrollToStatus?: string }
  | { kind: 'detail'; task: Task; from?: View }
  | { kind: 'form'; task?: Task }
  | { kind: 'settings' }
  | { kind: 'dag' }

type TasksResult =
  | { status: 'ready'; projectId: string; items: Task[] }
  | { status: 'error'; message: string }

type DepsResult = { projectId: string; blockerIds: Map<string, Set<string>>; rawDeps: RawDep[] }

type PendingTransition   = { task: Task; newStatus: string; blockerTitles: string[] }
type TransitionFeedback = {
  taskId: string
  statusLabel: string
  preState: { status: string; actual_start: string | null; actual_end: string | null }
  dateField?: 'actual_start' | 'actual_end'
}

function applyTaskChange(items: Task[], event: TaskChangeEvent): Task[] {
  if (event.eventType === 'INSERT') return [...items, event.record]
  if (event.eventType === 'UPDATE') return items.map((t) => (t.id === event.record.id ? event.record : t))
  return items.filter((t) => t.id !== event.id)
}

export function Board() {
  const [projects, setProjects]       = useState<Project[]>([])
  const [selectedId, setSelectedId]   = useState('')
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [projectsError, setProjectsError]     = useState<string | null>(null)
  const [tasksResult, setTasksResult]         = useState<TasksResult | null>(null)
  const [depsResult, setDepsResult]           = useState<DepsResult | null>(null)
  const [view, setView]                       = useState<View>({ kind: 'board' })
  const [transitionError, setTransitionError]       = useState<string | null>(null)
  const [pendingTransition, setPendingTransition]   = useState<PendingTransition | null>(null)
  const [transitionFeedback, setTransitionFeedback] = useState<TransitionFeedback | null>(null)
  const [showDiscarded, setShowDiscarded]           = useState(false)

  const columnsRef        = useRef<HTMLDivElement>(null)
  const columnRefs        = useRef<Map<string, HTMLDivElement>>(new Map())
  const taskIdsRef        = useRef<Set<string>>(new Set())
  const feedbackTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  const blockerIds = depsResult?.projectId === selectedId ? depsResult.blockerIds : new Map<string, Set<string>>()
  const rawDeps    = depsResult?.projectId === selectedId ? depsResult.rawDeps    : []

  useEffect(() => {
    if (view.kind !== 'board' || !view.scrollToStatus) return
    const colStatus = view.scrollToStatus === 'on_hold' ? 'in_progress' : view.scrollToStatus
    const colEl     = columnRefs.current.get(colStatus)
    const container = columnsRef.current
    if (!colEl || !container) return
    container.scrollLeft = colEl.offsetLeft - container.offsetLeft
  }, [view])

  const tasksLoading = tasksResult === null ||
    (tasksResult.status === 'ready' && tasksResult.projectId !== selectedId)
  const tasksError      = tasksResult?.status === 'error' ? tasksResult.message : null
  const allItems        = tasksResult?.status === 'ready' && tasksResult.projectId === selectedId ? tasksResult.items : []
  const tasks           = allItems.filter((t) => t.status !== 'discarded')
  const discardedTasks  = allItems.filter((t) => t.status === 'discarded')

  useEffect(() => {
    taskIdsRef.current = new Set(tasks.map((t) => t.id))
  }, [tasks])

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

    const unsubProjects = subscribeToProjectChanges((event: ProjectChangeEvent) => {
      if (event.eventType === 'DELETE') {
        setProjects((prev) => prev.filter((p) => p.id !== event.id))
        setSelectedId((prev) => prev === event.id ? '' : prev)
      } else {
        setProjects((prev) =>
          event.eventType === 'INSERT'
            ? [...prev, event.record].sort((a, b) => a.name.localeCompare(b.name))
            : prev.map((p) => p.id === event.record.id ? event.record : p)
        )
      }
    })

    const unsubContractors = subscribeToContractorChanges((event) => {
      if (event.eventType === 'DELETE') {
        setContractors((prev) => prev.filter((c) => c.id !== event.id))
      } else {
        setContractors((prev) =>
          event.eventType === 'INSERT'
            ? [...prev, event.record].sort((a, b) => a.name.localeCompare(b.name))
            : prev.map((c) => c.id === event.record.id ? event.record : c)
        )
      }
    })

    return () => { unsubProjects(); unsubContractors() }
  }, [])

  useEffect(() => {
    if (!selectedId) return

    listTasksByProject(selectedId)
      .then((data) => {
        setTasksResult({ status: 'ready', projectId: selectedId, items: data })
        const nonDiscarded = data.filter((t) => t.status !== 'discarded')
        if (nonDiscarded.length === 0) { setDepsResult({ projectId: selectedId, blockerIds: new Map(), rawDeps: [] }); return }
        listRawDepsByTasks(nonDiscarded.map((t) => t.id))
          .then((deps) => {
            const map = new Map<string, Set<string>>()
            for (const dep of deps) {
              if (!map.has(dep.task_id)) map.set(dep.task_id, new Set())
              map.get(dep.task_id)!.add(dep.depends_on_task_id)
            }
            setDepsResult({
              projectId: selectedId,
              blockerIds: map,
              rawDeps: deps.map(d => ({ task_id: d.task_id, depends_on_task_id: d.depends_on_task_id })),
            })
          })
          .catch(() => {})
      })
      .catch(() => setTasksResult({ status: 'error', message: 'Failed to load tasks' }))

    const unsubTasks = subscribeToTaskChanges(selectedId, (event) =>
      setTasksResult((prev) => {
        if (prev?.status !== 'ready' || prev.projectId !== selectedId) return prev
        return { ...prev, items: applyTaskChange(prev.items, event) }
      })
    )

    const unsubDeps = subscribeToDepsChanges(selectedId, (event: DepChangeEvent) => {
      if (!taskIdsRef.current.has(event.taskId)) return
      setDepsResult((prev) => {
        if (!prev || prev.projectId !== selectedId) return prev
        const nextBlockerIds = new Map(prev.blockerIds)
        const blockers = new Set(nextBlockerIds.get(event.taskId) ?? [])
        if (event.eventType === 'INSERT') blockers.add(event.blockerTaskId)
        else blockers.delete(event.blockerTaskId)
        nextBlockerIds.set(event.taskId, blockers)
        const nextRawDeps = event.eventType === 'INSERT'
          ? [...prev.rawDeps, { task_id: event.taskId, depends_on_task_id: event.blockerTaskId }]
          : prev.rawDeps.filter(d => !(d.task_id === event.taskId && d.depends_on_task_id === event.blockerTaskId))
        return { projectId: prev.projectId, blockerIds: nextBlockerIds, rawDeps: nextRawDeps }
      })
    })

    return () => {
      unsubTasks()
      unsubDeps()
    }
  }, [selectedId])

  function isBlocked(task: Task): boolean {
    const deps = blockerIds.get(task.id)
    if (!deps || deps.size === 0) return false
    return [...deps].some((bid) => {
      const blocker = tasks.find((t) => t.id === bid)
      return !blocker || blocker.status !== 'done'
    })
  }

  function dismissTransitionFeedback() {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    setTransitionFeedback(null)
  }

  function handleUndoTransition(taskId: string, preState: TransitionFeedback['preState']) {
    setTasksResult((prev) => {
      if (prev?.status !== 'ready') return prev
      return { ...prev, items: prev.items.map((t) => t.id === taskId ? { ...t, ...preState } : t) }
    })
    updateTask(taskId, preState).catch(() => {
      listTasksByProject(selectedId)
        .then((data) => setTasksResult((prev) => {
          if (prev?.status !== 'ready' || prev.projectId !== selectedId) return prev
          return { ...prev, items: data }
        }))
        .catch(() => {})
      setTransitionError('Failed to undo — refreshed from server')
    })
  }

  function executeStatusChange(task: Task, newStatus: string) {
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
          return { ...prev, items: data }
        }))
        .catch(() => {})
      const msg = newStatus === 'on_hold'
        ? 'Failed to pause task — refreshed from server'
        : task.status === 'on_hold'
          ? 'Failed to resume task — refreshed from server'
          : 'Failed to move task — refreshed from server'
      setTransitionError(msg)
    })

    const today    = new Date().toISOString().split('T')[0]
    const preState = { status: task.status, actual_start: task.actual_start, actual_end: task.actual_end }
    let dateField: TransitionFeedback['dateField']
    if (newStatus === 'in_progress' && task.actual_start && task.actual_start !== today) {
      dateField = 'actual_start'
    } else if (newStatus === 'done' && task.actual_end && task.actual_end !== today) {
      dateField = 'actual_end'
    }

    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    setTransitionFeedback({ taskId: task.id, statusLabel: STATUS_LABELS[newStatus] ?? newStatus, preState, dateField })
    feedbackTimerRef.current = setTimeout(() => setTransitionFeedback(null), 7000)
  }

  function handleStatusChange(task: Task, newStatus: string) {
    if (newStatus === 'in_progress' && isBlocked(task)) {
      const deps = blockerIds.get(task.id) ?? new Set<string>()
      const titles = [...deps]
        .map((bid) => tasks.find((t) => t.id === bid))
        .filter((t): t is Task => !!t && t.status !== 'done')
        .map((t) => t.title)
      if (titles.length > 0) {
        setPendingTransition({ task, newStatus, blockerTitles: titles })
        return
      }
    }
    executeStatusChange(task, newStatus)
  }

  if (projectsLoading) return <p className="board-message">Loading…</p>
  if (projectsError)   return <p className="board-message board-message--error">{projectsError}</p>

  const contractorName = (id: string | null) =>
    id ? (contractors.find((c) => c.id === id)?.name ?? null) : null

  if (view.kind === 'settings') {
    return (
      <div className="board">
        <Settings onBack={() => {
          setView({ kind: 'board' })
          loadContractors()
          listProjects().then((data) => {
            setProjects(data)
            setSelectedId((prev) => data.some((p) => p.id === prev) ? prev : '')
          }).catch(() => {})
        }} />
      </div>
    )
  }

  if (view.kind === 'detail') {
    const blockerTasks = [...(blockerIds.get(view.task.id) ?? [])].map((id) => tasks.find((t) => t.id === id)).filter((t): t is Task => !!t)
    const blocksTasks  = tasks.filter((t) => blockerIds.get(t.id)?.has(view.task.id))
    return (
      <div className="board">
        <TaskDetail
          task={view.task}
          contractorName={contractorName(view.task.contractor_id)}
          blockers={blockerTasks}
          blocks={blocksTasks}
          backLabel={view.from ? '← Back' : '← Board'}
          onBack={() => setView(view.from ?? { kind: 'board', scrollToStatus: view.task.status })}
          onEdit={() => setView({ kind: 'form', task: view.task })}
          onSelectTask={(t) => setView({ kind: 'detail', task: t, from: view })}
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
          projectTasks={tasks}
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
          <div className="select-wrap board-select">
            <select
              className="input select"
              value={selectedId}
              onChange={(e) => { dismissTransitionFeedback(); setShowDiscarded(false); setSelectedId(e.target.value) }}
              aria-label="Select project"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <FontAwesomeIcon icon={faChevronDown} className="select-chevron" />
          </div>
          <div className="board-toolbar-actions">
            {view.kind === 'board' && (
              <>
                <button
                  className="btn-outline"
                  onClick={() => setView({ kind: 'form' })}
                  disabled={!selectedId}
                  aria-label="New task"
                >
                  <FontAwesomeIcon icon={faPlus} />
                </button>
                <button
                  className={`btn-icon${showDiscarded ? ' board-toolbar-btn--active' : ''}`}
                  onClick={() => setShowDiscarded((prev) => !prev)}
                  disabled={!selectedId}
                  aria-pressed={showDiscarded}
                  aria-label="Show discarded tasks"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </>
            )}
            <button
              className="btn-icon"
              onClick={() => setView({ kind: 'settings' })}
              aria-label="Settings"
            >
              <FontAwesomeIcon icon={faGear} />
            </button>
          </div>
        </div>
        <div className="board-tabs">
          <button
            className={`board-tab${view.kind === 'board' ? ' board-tab--active' : ''}`}
            onClick={() => { setTransitionError(null); setPendingTransition(null); dismissTransitionFeedback(); setView({ kind: 'board' }) }}
          >Board</button>
          <button
            className={`board-tab${view.kind === 'dag' ? ' board-tab--active' : ''}`}
            onClick={() => { setTransitionError(null); setPendingTransition(null); dismissTransitionFeedback(); setView({ kind: 'dag' }) }}
            disabled={!selectedId}
          >Dependencies</button>
        </div>
        {tasksError && <p className="board-message board-message--error">{tasksError}</p>}
        {transitionError && <p className="board-message board-message--error">{transitionError}</p>}
        {pendingTransition && (
          <div className="board-blocker-warning">
            <p className="board-blocker-warning-text">
              Blocked by: {pendingTransition.blockerTitles.join(', ')}. Start anyway?
            </p>
            <div className="board-blocker-warning-actions">
              <button className="btn-outline" onClick={() => setPendingTransition(null)}>Cancel</button>
              <button className="btn-primary" onClick={() => {
                executeStatusChange(pendingTransition.task, pendingTransition.newStatus)
                setPendingTransition(null)
              }}>Proceed</button>
            </div>
          </div>
        )}
        {transitionFeedback && (
          <div className="board-transition-feedback">
            <button
              className="board-transition-feedback-close"
              onClick={dismissTransitionFeedback}
              aria-label="Dismiss"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
            <p className="board-transition-feedback-text">Moved to {transitionFeedback.statusLabel}.</p>
            <div className="board-transition-feedback-actions">
              {transitionFeedback.dateField && (
                <button
                  className="btn-outline"
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0]
                    updateTask(transitionFeedback.taskId, { [transitionFeedback.dateField!]: today }).catch(() => {})
                    dismissTransitionFeedback()
                  }}
                >
                  Update {transitionFeedback.dateField === 'actual_start' ? 'start' : 'end'}
                </button>
              )}
              <button
                className="btn-outline"
                onClick={() => {
                  handleUndoTransition(transitionFeedback.taskId, transitionFeedback.preState)
                  dismissTransitionFeedback()
                }}
              >
                Undo
              </button>
            </div>
          </div>
        )}
      </div>

      {view.kind === 'dag' && (
        tasksLoading
          ? <p className="board-message dag-placeholder">Loading…</p>
          : <DagView
              tasks={tasks}
              rawDeps={rawDeps}
              onSelectTask={(t) => setView({ kind: 'detail', task: t, from: { kind: 'dag' } })}
            />
      )}

      {view.kind !== 'dag' && <div className="board-columns" ref={columnsRef}>
        {COLUMNS.map(({ status, label }) => {
          const colTasks = tasks.filter((t) =>
            t.status === status || (status === 'in_progress' && t.status === 'on_hold')
          )
          return (
            <div
              key={status}
              className="board-column"
              ref={(el) => { if (el) columnRefs.current.set(status, el); else columnRefs.current.delete(status) }}
            >
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
                        isBlocked={isBlocked(task)}
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
        {showDiscarded && (
          <div className="board-column board-column--discarded">
            <span className="eyebrow">Discarded</span>
            <div className="board-column-body">
              {tasksLoading ? (
                <p className="board-column-empty">Loading…</p>
              ) : discardedTasks.length === 0 ? (
                <p className="board-column-empty">No tasks</p>
              ) : (
                discardedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    contractorName={contractorName(task.contractor_id)}
                    prevStatus={null}
                    nextStatus={null}
                    isBlocked={false}
                    onSelect={(t) => setView({ kind: 'detail', task: t })}
                    onStatusChange={() => {}}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>}
    </div>
  )
}

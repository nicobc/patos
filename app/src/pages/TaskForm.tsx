import { useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../context/useAuth'
import {
  createTask,
  updateTask,
  listBlockers,
  setBlockers,
  type Task,
  type TaskInsert,
  type TaskUpdate,
} from '../services/tasksService'
import type { Contractor } from '../services/contractorsService'
import './TaskForm.css'

const STATUSES = [
  { value: 'ideation',    label: 'Ideation'    },
  { value: 'planned',     label: 'Planned'     },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'on_hold',     label: 'On Hold'     },
  { value: 'done',        label: 'Done'        },
] as const

const ACTIVE_STATUSES = new Set(['ideation', 'planned', 'in_progress', 'on_hold'])

interface Props {
  task?: Task
  projectId: string
  contractors: Contractor[]
  projectTasks?: Task[]
  onBack: () => void
  onSaved: (task: Task) => void
}

function startRequired(status: string) { return status === 'in_progress' || status === 'on_hold' || status === 'done' }
function endRequired(status: string)   { return status === 'done' }

export function TaskForm({ task, projectId, contractors, projectTasks = [], onBack, onSaved }: Props) {
  const { session } = useAuth()
  const isEdit = task != null

  const [title, setTitle]               = useState(task?.title ?? '')
  const [description, setDescription]   = useState(task?.description ?? '')
  const [contractorId, setContractorId] = useState(task?.contractor_id ?? '')
  const [status, setStatus]             = useState(task?.status ?? 'ideation')
  const [expectedCost, setExpectedCost] = useState(task?.expected_cost?.toString() ?? '')
  const [actualCost, setActualCost]     = useState(task?.actual_cost?.toString() ?? '')
  const [expectedDuration, setExpectedDuration] = useState(task?.expected_duration_days?.toString() ?? '')
  const [actualStart, setActualStart]   = useState(task?.actual_start ?? '')
  const [actualEnd, setActualEnd]       = useState(task?.actual_end ?? '')
  const [selectedBlockerIds, setSelectedBlockerIds] = useState<string[]>([])
  const [initialBlockerIds, setInitialBlockerIds]   = useState<string[]>([])

  const [confirmBack, setConfirmBack]   = useState(false)
  const [pendingStatus, setPendingStatus] = useState<string | null>(null)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [titleError, setTitleError]     = useState(false)

  const blockerPanelRef = useRef<HTMLDivElement>(null)
  const blockerTriggerRef = useRef<HTMLButtonElement>(null)
  const [blockerPanelOpen, setBlockerPanelOpen] = useState(false)

  useEffect(() => {
    if (!blockerPanelOpen) return
    function handleOutside(e: MouseEvent) {
      if (blockerPanelRef.current && !blockerPanelRef.current.contains(e.target as Node)) {
        setBlockerPanelOpen(false)
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') { setBlockerPanelOpen(false); blockerTriggerRef.current?.focus() }
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [blockerPanelOpen])

  const taskId = task?.id
  useEffect(() => {
    if (!taskId) return
    listBlockers(taskId)
      .then((blockers) => {
        const ids = blockers.map((b) => b.id)
        setSelectedBlockerIds(ids)
        setInitialBlockerIds(ids)
      })
      .catch(() => {})
  }, [taskId])

  const otherTasks = projectTasks.filter((t) => t.id !== task?.id)
  const activeTasks    = otherTasks.filter((t) => ACTIVE_STATUSES.has(t.status))
  const completedTasks = otherTasks.filter((t) => !ACTIVE_STATUSES.has(t.status))

  const blockersDirty = isEdit
    ? [...selectedBlockerIds].sort().join(',') !== [...initialBlockerIds].sort().join(',')
    : selectedBlockerIds.length > 0

  const isDirty = isEdit
    ? title !== task.title ||
      description !== (task.description ?? '') ||
      contractorId !== (task.contractor_id ?? '') ||
      status !== task.status ||
      expectedCost !== (task.expected_cost?.toString() ?? '') ||
      actualCost !== (task.actual_cost?.toString() ?? '') ||
      expectedDuration !== (task.expected_duration_days?.toString() ?? '') ||
      actualStart !== (task.actual_start ?? '') ||
      actualEnd !== (task.actual_end ?? '') ||
      blockersDirty
    : title !== '' || description !== '' || contractorId !== '' ||
      expectedCost !== '' || actualCost !== '' || expectedDuration !== '' || actualStart !== '' || actualEnd !== '' ||
      blockersDirty

  function handleBack() {
    if (isDirty) { setConfirmBack(true) } else { onBack() }
  }

  function handleStatusChange(newStatus: string) {
    if (newStatus === 'in_progress') {
      const unresolved = selectedBlockerIds.filter((id) => {
        const blocker = projectTasks.find((t) => t.id === id)
        return !blocker || blocker.status !== 'done'
      })
      if (unresolved.length > 0) {
        setPendingStatus(newStatus)
        return
      }
    }
    setStatus(newStatus)
  }

  function toggleBlocker(id: string, checked: boolean) {
    setSelectedBlockerIds((prev) =>
      checked ? [...prev, id] : prev.filter((bid) => bid !== id)
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTitleError(false)
    setError(null)

    if (!title.trim()) { setTitleError(true); return }
    if (startRequired(status) && !actualStart) { setError('Start date is required'); return }
    if (endRequired(status) && !actualEnd) { setError('End date is required'); return }

    setLoading(true)
    try {
      if (isEdit) {
        const update: TaskUpdate = {
          title: title.trim(),
          description: description || null,
          contractor_id: contractorId || null,
          status,
          expected_cost: expectedCost ? parseFloat(expectedCost) : null,
          actual_cost: actualCost ? parseFloat(actualCost) : null,
          expected_duration_days: expectedDuration ? parseInt(expectedDuration, 10) : null,
          actual_start: actualStart || null,
          actual_end: actualEnd || null,
        }
        const saved = await updateTask(task.id, update)
        await setBlockers(task.id, selectedBlockerIds)
        onSaved(saved)
      } else {
        const insert: TaskInsert = {
          title: title.trim(),
          description: description || null,
          contractor_id: contractorId || null,
          project_id: projectId,
          owner_id: session?.user.id ?? null,
          status: 'ideation',
          expected_cost: expectedCost ? parseFloat(expectedCost) : null,
          actual_cost: actualCost ? parseFloat(actualCost) : null,
          expected_duration_days: expectedDuration ? parseInt(expectedDuration, 10) : null,
          actual_start: actualStart || null,
          actual_end: actualEnd || null,
        }
        const created = await createTask(insert)
        if (selectedBlockerIds.length > 0) {
          await setBlockers(created.id, selectedBlockerIds)
        }
        onSaved(created)
      }
    } catch {
      setError(isEdit ? 'Failed to save task' : 'Failed to create task')
      setLoading(false)
    }
  }

  if (confirmBack) {
    return (
      <div className="task-form">
        <p className="task-form-confirm-prompt">Discard unsaved changes?</p>
        <div className="task-form-confirm-row">
          <button className="btn-outline" onClick={() => setConfirmBack(false)}>Keep editing</button>
          <button className="btn-primary" onClick={onBack}>Discard</button>
        </div>
      </div>
    )
  }

  if (pendingStatus) {
    const names = selectedBlockerIds
      .map((id) => projectTasks.find((t) => t.id === id))
      .filter((t): t is Task => !!t && t.status !== 'done')
      .map((t) => t.title)
    return (
      <div className="task-form">
        <p className="task-form-confirm-prompt">
          This task is blocked by: {names.join(', ')}. Start anyway?
        </p>
        <div className="task-form-confirm-row">
          <button className="btn-outline" onClick={() => setPendingStatus(null)}>Cancel</button>
          <button className="btn-primary" onClick={() => { setStatus(pendingStatus); setPendingStatus(null) }}>
            Proceed anyway
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="task-form">
      <div className="task-form-toolbar">
        <button className="btn-ghost task-form-back" onClick={handleBack}>
          {isEdit ? '← Task' : '← Board'}
        </button>
      </div>

      <h2 className="task-form-heading">{isEdit ? 'Edit task' : 'New task'}</h2>

      <form className="task-form-fields" onSubmit={handleSubmit} noValidate>
        <label className="task-form-label">
          <span>Title <span className="task-form-required">*</span></span>
          <input
            className={`input${titleError ? ' task-form-input--error' : ''}`}
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setTitleError(false) }}
          />
          {titleError && <span className="task-form-field-error">Required</span>}
        </label>

        <label className="task-form-label">
          <span>Description</span>
          <textarea
            className="input task-form-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        <label className="task-form-label">
          <span>Contractor</span>
          <div className="select-wrap">
            <select className="input select" value={contractorId} onChange={(e) => setContractorId(e.target.value)}>
              <option value="">Unassigned</option>
              {contractors.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <FontAwesomeIcon icon={faChevronDown} className="select-chevron" />
          </div>
        </label>

        {isEdit && (
          <label className="task-form-label">
            <span>Status</span>
            <div className="select-wrap">
              <select className="input select" value={status} onChange={(e) => handleStatusChange(e.target.value)}>
                {STATUSES
                  .filter(({ value }) =>
                    value !== 'on_hold' || task?.status === 'in_progress' || task?.status === 'on_hold'
                  )
                  .map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
              </select>
              <FontAwesomeIcon icon={faChevronDown} className="select-chevron" />
            </div>
          </label>
        )}

        <div className="task-form-label">
          <span>Blocked by</span>
          <div className="task-form-multiselect" ref={blockerPanelRef}>
            <button
              type="button"
              ref={blockerTriggerRef}
              className="input select task-form-multiselect-trigger"
              onClick={() => setBlockerPanelOpen((o) => !o)}
            >
              <span>
                {selectedBlockerIds.length === 0
                  ? 'No blockers'
                  : `${selectedBlockerIds.length} blocker${selectedBlockerIds.length > 1 ? 's' : ''}`}
              </span>
              <FontAwesomeIcon icon={faChevronDown} className="select-chevron" />
            </button>
            {blockerPanelOpen && (
              <div className="dropdown task-form-multiselect-panel">
                {activeTasks.length === 0 && completedTasks.length === 0 ? (
                  <p className="task-form-multiselect-empty">No other tasks in this project</p>
                ) : (
                  <>
                    {activeTasks.map((t) => (
                      <label key={t.id} className="task-form-multiselect-option">
                        <input
                          type="checkbox"
                          checked={selectedBlockerIds.includes(t.id)}
                          onChange={(e) => toggleBlocker(t.id, e.target.checked)}
                        />
                        <span>{t.title}</span>
                      </label>
                    ))}
                    {activeTasks.length > 0 && completedTasks.length > 0 && (
                      <hr className="task-form-multiselect-divider" />
                    )}
                    {completedTasks.map((t) => (
                      <label key={t.id} className="task-form-multiselect-option task-form-multiselect-option--dim">
                        <input
                          type="checkbox"
                          checked={selectedBlockerIds.includes(t.id)}
                          onChange={(e) => toggleBlocker(t.id, e.target.checked)}
                        />
                        <span>{t.title}</span>
                      </label>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <label className="task-form-label">
          <span>Expected cost (€)</span>
          <input
            className="input"
            type="number"
            min="0"
            step="0.01"
            value={expectedCost}
            onChange={(e) => setExpectedCost(e.target.value)}
          />
        </label>

        <label className="task-form-label">
          <span>Actual cost (€)</span>
          <input
            className="input"
            type="number"
            min="0"
            step="0.01"
            value={actualCost}
            onChange={(e) => setActualCost(e.target.value)}
          />
        </label>

        <label className="task-form-label">
          <span>Expected duration (days)</span>
          <input
            className="input"
            type="number"
            min="0"
            step="1"
            value={expectedDuration}
            onChange={(e) => setExpectedDuration(e.target.value)}
          />
        </label>

        <label className="task-form-label">
          <span>Start date{startRequired(status) && <span className="task-form-required"> *</span>}</span>
          <input
            className="input"
            type="date"
            value={actualStart}
            onChange={(e) => setActualStart(e.target.value)}
          />
        </label>

        <label className="task-form-label">
          <span>End date{endRequired(status) && <span className="task-form-required"> *</span>}</span>
          <input
            className="input"
            type="date"
            value={actualEnd}
            onChange={(e) => setActualEnd(e.target.value)}
          />
        </label>

        {error && <p className="task-form-error">{error}</p>}

        <div className="task-form-actions">
          <button type="button" className="btn-outline" onClick={handleBack} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '…' : isEdit ? 'Save' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  )
}

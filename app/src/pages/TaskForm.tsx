import { useState } from 'react'
import { useAuth } from '../context/useAuth'
import { createTask, updateTask, type Task, type TaskInsert, type TaskUpdate } from '../services/tasksService'
import type { Contractor } from '../services/contractorsService'
import './TaskForm.css'

const STATUSES = [
  { value: 'ideation',    label: 'Ideation'    },
  { value: 'planned',     label: 'Planned'     },
  { value: 'ready',       label: 'Ready'       },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done',        label: 'Done'        },
] as const

interface Props {
  task?: Task
  projectId: string
  contractors: Contractor[]
  onBack: () => void
  onSaved: (task: Task) => void
}

function startRequired(status: string) { return status === 'in_progress' || status === 'done' }
function endRequired(status: string)   { return status === 'done' }

export function TaskForm({ task, projectId, contractors, onBack, onSaved }: Props) {
  const { session } = useAuth()
  const isEdit = task != null

  const [title, setTitle]               = useState(task?.title ?? '')
  const [description, setDescription]   = useState(task?.description ?? '')
  const [contractorId, setContractorId] = useState(task?.contractor_id ?? '')
  const [status, setStatus]             = useState(task?.status ?? 'ideation')
  const [expectedCost, setExpectedCost] = useState(task?.expected_cost?.toString() ?? '')
  const [expectedDuration, setExpectedDuration] = useState(task?.expected_duration_days?.toString() ?? '')
  const [actualStart, setActualStart]   = useState(task?.actual_start ?? '')
  const [actualEnd, setActualEnd]       = useState(task?.actual_end ?? '')

  const [confirmBack, setConfirmBack] = useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [titleError, setTitleError]   = useState(false)

  const isDirty = isEdit
    ? title !== task.title ||
      description !== (task.description ?? '') ||
      contractorId !== (task.contractor_id ?? '') ||
      status !== task.status ||
      expectedCost !== (task.expected_cost?.toString() ?? '') ||
      expectedDuration !== (task.expected_duration_days?.toString() ?? '') ||
      actualStart !== (task.actual_start ?? '') ||
      actualEnd !== (task.actual_end ?? '')
    : title !== '' || description !== '' || contractorId !== '' ||
      expectedCost !== '' || expectedDuration !== '' || actualStart !== '' || actualEnd !== ''

  function handleBack() {
    if (isDirty) { setConfirmBack(true) } else { onBack() }
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
          expected_duration_days: expectedDuration ? parseInt(expectedDuration, 10) : null,
          actual_start: actualStart || null,
          actual_end: actualEnd || null,
        }
        onSaved(await updateTask(task.id, update))
      } else {
        const insert: TaskInsert = {
          title: title.trim(),
          description: description || null,
          contractor_id: contractorId || null,
          project_id: projectId,
          owner_id: session?.user.id ?? null,
          status: 'ideation',
          expected_cost: expectedCost ? parseFloat(expectedCost) : null,
          expected_duration_days: expectedDuration ? parseInt(expectedDuration, 10) : null,
          actual_start: actualStart || null,
          actual_end: actualEnd || null,
        }
        onSaved(await createTask(insert))
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
          <select className="input" value={contractorId} onChange={(e) => setContractorId(e.target.value)}>
            <option value="">Unassigned</option>
            {contractors.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>

        {isEdit && (
          <label className="task-form-label">
            <span>Status</span>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
        )}

        <label className="task-form-label">
          <span>Expected cost ($)</span>
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

import { useState } from 'react'
import { updateTask, deleteTask, type Task } from '../services/tasksService'
import './TaskDetail.css'

const STATUS_LABELS: Record<string, string> = {
  ideation:    'Ideation',
  planned:     'Planned',
  ready:       'Ready',
  in_progress: 'In Progress',
  on_hold:     'On Hold',
  done:        'Done',
  discarded:   'Discarded',
}

interface Props {
  task: Task
  contractorName: string | null
  onBack: () => void
  onEdit?: () => void
}

export function TaskDetail({ task, contractorName, onBack, onEdit }: Props) {
  const [pending, setPending] = useState<'discard' | 'delete' | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function commit() {
    if (!pending) return
    setLoading(true)
    setError(null)
    try {
      if (pending === 'discard') {
        await updateTask(task.id, { status: 'discarded' })
      } else {
        await deleteTask(task.id)
      }
      onBack()
    } catch {
      setError(pending === 'discard' ? 'Failed to discard task' : 'Failed to delete task')
      setLoading(false)
    }
  }

  const fmtDate = (v: string | null) => v ? new Date(v).toLocaleDateString() : '—'
  const fmtCost = (v: number | null) => v != null ? `$${v.toLocaleString()}` : '—'
  const fmtDays = (v: number | null) => v != null ? `${v} days` : '—'

  return (
    <div className="task-detail">
      <div className="task-detail-toolbar">
        <button className="btn-ghost task-detail-back" onClick={onBack}>← Board</button>
        <button className="btn-outline" onClick={onEdit}>Edit</button>
      </div>

      <h2 className="task-detail-title">{task.title}</h2>

      <dl className="task-detail-fields">
        <dt>Status</dt>
        <dd>{STATUS_LABELS[task.status] ?? task.status}</dd>

        {task.description && (
          <>
            <dt>Description</dt>
            <dd>{task.description}</dd>
          </>
        )}

        <dt>Contractor</dt>
        <dd>{contractorName ?? 'Unassigned'}</dd>

        <dt>Expected cost</dt>
        <dd>{fmtCost(task.expected_cost)}</dd>

        <dt>Actual cost</dt>
        <dd>{fmtCost(task.actual_cost)}</dd>

        <dt>Expected duration</dt>
        <dd>{fmtDays(task.expected_duration_days)}</dd>

        <dt>Start</dt>
        <dd>{fmtDate(task.actual_start)}</dd>

        <dt>End</dt>
        <dd>{fmtDate(task.actual_end)}</dd>

        <dt>Created</dt>
        <dd>{fmtDate(task.created_at)}</dd>
      </dl>

      {error && <p className="task-detail-error">{error}</p>}

      <div className="task-detail-actions">
        {pending ? (
          <>
            <p className="task-detail-confirm-prompt">
              {pending === 'discard' ? 'Discard this task?' : 'Delete this task permanently?'}
            </p>
            <div className="task-detail-confirm-row">
              <button
                className="btn-outline"
                onClick={() => { setPending(null); setError(null) }}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="btn-primary task-detail-confirm--danger"
                onClick={commit}
                disabled={loading}
              >
                {loading ? '…' : 'Confirm'}
              </button>
            </div>
          </>
        ) : (
          <div className="task-detail-action-row">
            <button className="btn-ghost" onClick={() => setPending('discard')}>Discard</button>
            <button className="btn-ghost task-detail-btn--danger" onClick={() => setPending('delete')}>Delete</button>
          </div>
        )}
      </div>
    </div>
  )
}

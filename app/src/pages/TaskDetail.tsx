import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPen, faXmark } from '@fortawesome/free-solid-svg-icons'
import { updateTask, deleteTask, type Task } from '../services/tasksService'
import { useToast } from '../context/useToast'
import { formatCost, formatDate } from '../lib/formatters'
import './TaskDetail.css'

const STATUS_LABELS: Record<string, string> = {
  ideation:    'Ideation',
  planned:     'Planned',
  in_progress: 'In Progress',
  on_hold:     'On Hold',
  done:        'Done',
  discarded:   'Discarded',
}

interface Props {
  task: Task
  contractorName: string | null
  blockers: Task[]
  blocks: Task[]
  onBack: () => void
  onEdit?: () => void
  onSelectTask: (task: Task) => void
}

export function TaskDetail({ task, contractorName, blockers, blocks, onBack, onEdit, onSelectTask }: Props) {
  const { showToast } = useToast()
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
        showToast('Task discarded')
      } else {
        await deleteTask(task.id)
        showToast('Task deleted')
      }
      onBack()
    } catch {
      setError(pending === 'discard' ? 'Failed to discard task' : 'Failed to delete task')
      setLoading(false)
    }
  }

  async function restore() {
    setLoading(true)
    setError(null)
    try {
      await updateTask(task.id, { status: 'ideation' })
      showToast('Task restored')
      onBack()
    } catch {
      setError('Failed to restore task')
      setLoading(false)
    }
  }

  return (
    <div className="task-detail">
      <div className="page-header">
        <h2 className="page-title">{task.title}</h2>
        <button className="btn-icon task-detail-edit-btn" onClick={onEdit} aria-label="Edit task">
          <FontAwesomeIcon icon={faPen} />
        </button>
        <button className="btn-icon" onClick={onBack} aria-label="Close">
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>

      <div className="task-detail-body">
        {task.description && (
          <div className="task-detail-cell">
            <span className="task-detail-cell-label">Description</span>
            <span>{task.description}</span>
          </div>
        )}

        <div className="task-detail-cell">
          <span className="task-detail-cell-label">Status</span>
          <span>{STATUS_LABELS[task.status] ?? task.status}</span>
        </div>

        <div className="task-detail-cell">
          <span className="task-detail-cell-label">Contractor</span>
          <span>{contractorName ?? 'Unassigned'}</span>
        </div>

        {blockers.length > 0 && (
          <div className="task-detail-cell">
            <span className="task-detail-cell-label">Blocked by</span>
            <div className="dep-chip-list">
              {blockers.map((t) => (
                <button key={t.id} className="dep-chip" onClick={() => onSelectTask(t)}>{t.title}</button>
              ))}
            </div>
          </div>
        )}

        {blocks.length > 0 && (
          <div className="task-detail-cell">
            <span className="task-detail-cell-label">Blocks</span>
            <div className="dep-chip-list">
              {blocks.map((t) => (
                <button key={t.id} className="dep-chip" onClick={() => onSelectTask(t)}>{t.title}</button>
              ))}
            </div>
          </div>
        )}

        <div className="planning-detail-grid">
          <div className="task-detail-cell">
            <span className="task-detail-cell-label">Expected cost</span>
            <span>{formatCost(task.expected_cost)}</span>
          </div>
          <div className="task-detail-cell">
            <span className="task-detail-cell-label">Actual cost</span>
            <span>{formatCost(task.actual_cost)}</span>
          </div>
          <div className="task-detail-cell">
            <span className="task-detail-cell-label">Expected start</span>
            <span>{formatDate(task.expected_start)}</span>
          </div>
          <div className="task-detail-cell">
            <span className="task-detail-cell-label">Actual start</span>
            <span>{formatDate(task.actual_start)}</span>
          </div>
          <div className="task-detail-cell">
            <span className="task-detail-cell-label">Expected end</span>
            <span>{formatDate(task.expected_end)}</span>
          </div>
          <div className="task-detail-cell">
            <span className="task-detail-cell-label">Actual end</span>
            <span>{formatDate(task.actual_end)}</span>
          </div>
        </div>

        <div className="task-detail-cell">
          <span className="task-detail-cell-label">Created</span>
          <span>{formatDate(task.created_at)}</span>
        </div>
      </div>

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
              <button className="btn-danger" onClick={commit} disabled={loading}>
                {loading ? '…' : 'Confirm'}
              </button>
            </div>
          </>
        ) : (
          <div className="task-detail-action-row">
            {task.status === 'discarded' ? (
              <button className="btn-outline" onClick={restore} disabled={loading}>
                {loading ? '…' : 'Restore'}
              </button>
            ) : (
              <button className="btn-ghost" onClick={() => setPending('discard')}>Discard</button>
            )}
            <button className="btn-ghost task-detail-btn--danger" onClick={() => setPending('delete')}>Delete</button>
          </div>
        )}
      </div>
    </div>
  )
}

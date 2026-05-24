import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPause, faPlay } from '@fortawesome/free-solid-svg-icons'
import type { Task } from '../services/tasksService'
import './TaskCard.css'

interface Props {
  task: Task
  contractorName: string | null
  prevStatus: string | null
  nextStatus: string | null
  onSelect: (task: Task) => void
  onStatusChange: (task: Task, newStatus: string) => void
}

export function TaskCard({ task, contractorName, prevStatus, nextStatus, onSelect, onStatusChange }: Props) {
  const isOnHold = task.status === 'on_hold'
  const showHoldToggle = task.status === 'in_progress' || isOnHold

  return (
    <div className="task-card">
      <button className="task-card-body" onClick={() => onSelect(task)}>
        <span className="task-card-title">{task.title}</span>
        {contractorName && (
          <span className="task-card-contractor">{contractorName}</span>
        )}
      </button>
      {showHoldToggle && (
        <button
          className="btn-icon task-card-hold"
          onClick={() => onStatusChange(task, isOnHold ? 'in_progress' : 'on_hold')}
          aria-label={isOnHold ? 'Resume task' : 'Put task on hold'}
        >
          <FontAwesomeIcon icon={isOnHold ? faPlay : faPause} />
        </button>
      )}
      <div className="task-card-controls">
        <button
          className="btn-icon task-card-nav"
          disabled={!prevStatus || isOnHold}
          onClick={() => prevStatus && onStatusChange(task, prevStatus)}
          aria-label="Previous status"
        >‹</button>
        <button
          className="btn-icon task-card-nav"
          disabled={!nextStatus || isOnHold}
          onClick={() => nextStatus && onStatusChange(task, nextStatus)}
          aria-label="Next status"
        >›</button>
      </div>
    </div>
  )
}

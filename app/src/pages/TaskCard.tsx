import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAngleLeft, faAngleRight, faLock, faPause, faPlay } from '@fortawesome/free-solid-svg-icons'
import type { Task } from '../services/tasksService'
import './TaskCard.css'

interface Props {
  task: Task
  contractorName: string | null
  prevStatus: string | null
  nextStatus: string | null
  isBlocked: boolean
  onSelect: (task: Task) => void
  onStatusChange: (task: Task, newStatus: string) => void
}

export function TaskCard({ task, contractorName, prevStatus, nextStatus, isBlocked, onSelect, onStatusChange }: Props) {
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
      {isBlocked && (
        <div className="task-card-icons">
          <FontAwesomeIcon icon={faLock} className="task-card-icon" aria-label="Blocked" />
        </div>
      )}
      <div className="task-card-controls">
        <button
          className="btn-icon task-card-nav"
          disabled={!prevStatus || isOnHold}
          onClick={() => prevStatus && onStatusChange(task, prevStatus)}
          aria-label="Previous status"
        ><FontAwesomeIcon icon={faAngleLeft} /></button>
        {showHoldToggle && (
          <button
            className={`task-card-icon task-card-icon--btn${isOnHold ? ' task-card-icon--active' : ''}`}
            onClick={() => onStatusChange(task, isOnHold ? 'in_progress' : 'on_hold')}
            aria-label={isOnHold ? 'Resume task' : 'Put task on hold'}
          >
            <FontAwesomeIcon icon={isOnHold ? faPlay : faPause} />
          </button>
        )}
        <button
          className="btn-icon task-card-nav"
          disabled={!nextStatus || isOnHold}
          onClick={() => nextStatus && onStatusChange(task, nextStatus)}
          aria-label="Next status"
        ><FontAwesomeIcon icon={faAngleRight} /></button>
      </div>
    </div>
  )
}

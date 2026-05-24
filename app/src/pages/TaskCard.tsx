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
  return (
    <div className="task-card">
      <button className="task-card-body" onClick={() => onSelect(task)}>
        <span className="task-card-title">{task.title}</span>
        {contractorName && (
          <span className="task-card-contractor">{contractorName}</span>
        )}
      </button>
      <div className="task-card-controls">
        <button
          className="btn-icon task-card-nav"
          disabled={!prevStatus}
          onClick={() => prevStatus && onStatusChange(task, prevStatus)}
          aria-label="Previous status"
        >‹</button>
        <button
          className="btn-icon task-card-nav"
          disabled={!nextStatus}
          onClick={() => nextStatus && onStatusChange(task, nextStatus)}
          aria-label="Next status"
        >›</button>
      </div>
    </div>
  )
}

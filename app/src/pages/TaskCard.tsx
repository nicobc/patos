import type { Task } from '../services/tasksService'
import './TaskCard.css'

interface Props {
  task: Task
  contractorName: string | null
  onSelect: (task: Task) => void
}

export function TaskCard({ task, contractorName, onSelect }: Props) {
  return (
    <button className="task-card" onClick={() => onSelect(task)}>
      <span className="task-card-title">{task.title}</span>
      {contractorName && (
        <span className="task-card-contractor">{contractorName}</span>
      )}
    </button>
  )
}

import { useEffect, useState } from 'react'
import { listProjects, type Project } from '../services/projectsService'
import './Board.css'

const COLUMNS = [
  { status: 'ideation',    label: 'Ideation'    },
  { status: 'planned',     label: 'Planned'     },
  { status: 'ready',       label: 'Ready'       },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'done',        label: 'Done'        },
] as const

export function Board() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listProjects()
      .then((data) => {
        setProjects(data)
        if (data.length > 0) setSelectedId(data[0].id)
      })
      .catch(() => setError('Failed to load projects'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="board-message">Loading…</p>
  if (error)   return <p className="board-message board-message--error">{error}</p>

  return (
    <div className="board">
      <div className="board-toolbar">
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
      </div>

      <div className="board-columns">
        {COLUMNS.map(({ status, label }) => (
          <div key={status} className="board-column">
            <span className="eyebrow">{label}</span>
            <div className="board-column-body">
              <p className="board-column-empty">No tasks</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

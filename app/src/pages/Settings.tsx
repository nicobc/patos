import { useState, useEffect } from 'react'
import { useToast } from '../context/useToast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMobileScreen, faMoon, faPen, faSun, faTrash, faXmark } from '@fortawesome/free-solid-svg-icons'
import {
  listContractors,
  subscribeToContractorChanges,
  createContractor,
  updateContractor,
  deleteContractor,
  countTasksByContractor,
  type Contractor,
  type ContractorInsert,
  type ContractorUpdate,
} from '../services/contractorsService'
import {
  listProjects,
  subscribeToProjectChanges,
  createProject,
  updateProject,
  deleteProject,
  countTasksByProject,
  type Project,
  type ProjectInsert,
  type ProjectUpdate,
} from '../services/projectsService'
import {
  listRooms,
  subscribeToRoomChanges,
  createRoom,
  updateRoom,
  deleteRoom,
  type Room,
} from '../services/roomsService'
import './Settings.css'

type SettingsView =
  | { kind: 'list' }
  | { kind: 'contractor-form'; contractor?: Contractor }
  | { kind: 'project-form'; project?: Project }

type ContractorDeleteState =
  | { id: string; kind: 'checking' }
  | { id: string; kind: 'confirm' }
  | { id: string; kind: 'blocked'; count: number }

type ProjectDeleteState =
  | { id: string; kind: 'checking' }
  | { id: string; kind: 'confirm' }
  | { id: string; kind: 'hard-confirm'; input: string; taskCount: number }

type Theme = 'auto' | 'light' | 'dark'

type RoomEditState = { id: string; name: string; color: string; saving: boolean }

const ROOM_PALETTE = [
  '#e74c3c',
  '#e67e22',
  '#f1c40f',
  '#27ae60',
  '#1abc9c',
  '#3498db',
  '#2980b9',
  '#9b59b6',
  '#e91e63',
  '#795548',
  '#607d8b',
  '#95a5a6',
] as const

function applyTheme(t: Theme) {
  if (t === 'auto') {
    delete document.documentElement.dataset.theme
    localStorage.removeItem('theme')
  } else {
    document.documentElement.dataset.theme = t
    localStorage.setItem('theme', t)
  }
}

export function Settings({ onBack }: { onBack: () => void }) {
  const { showToast } = useToast()
  const [view, setView] = useState<SettingsView>({ kind: 'list' })
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme')
    return stored === 'dark' || stored === 'light' ? stored : 'auto'
  })

  const [projects, setProjects]             = useState<Project[]>([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [projectsError, setProjectsError]   = useState<string | null>(null)
  const [projectDeleteState, setProjectDeleteState] = useState<ProjectDeleteState | null>(null)
  const [projectDeleting, setProjectDeleting] = useState(false)

  const [contractors, setContractors]       = useState<Contractor[]>([])
  const [contractorsLoading, setContractorsLoading] = useState(true)
  const [contractorsError, setContractorsError] = useState<string | null>(null)
  const [contractorDeleteState, setContractorDeleteState] = useState<ContractorDeleteState | null>(null)
  const [contractorDeleting, setContractorDeleting] = useState(false)

  const [rooms, setRooms]                     = useState<Room[]>([])
  const [roomsLoading, setRoomsLoading]       = useState(true)
  const [roomsError, setRoomsError]           = useState<string | null>(null)
  const [showRoomAddForm, setShowRoomAddForm] = useState(false)
  const [addRoomName, setAddRoomName]         = useState('')
  const [addRoomColor, setAddRoomColor]       = useState('')
  const [addRoomSaving, setAddRoomSaving]     = useState(false)
  const [roomEditState, setRoomEditState]     = useState<RoomEditState | null>(null)
  const [roomDeleteState, setRoomDeleteState] = useState<{ id: string } | null>(null)
  const [roomDeleting, setRoomDeleting]       = useState(false)

  useEffect(() => {
    listProjects()
      .then(setProjects)
      .catch(() => setProjectsError('Failed to load projects'))
      .finally(() => setProjectsLoading(false))

    listContractors()
      .then(setContractors)
      .catch(() => setContractorsError('Failed to load contractors'))
      .finally(() => setContractorsLoading(false))

    const unsubProjects = subscribeToProjectChanges((event) => {
      if (event.eventType === 'DELETE') {
        setProjects((prev) => prev.filter((p) => p.id !== event.id))
        setProjectDeleteState((prev) => prev?.id === event.id ? null : prev)
      } else {
        setProjects((prev) =>
          event.eventType === 'INSERT'
            ? prev.some((p) => p.id === event.record.id)
              ? prev
              : [...prev, event.record].sort((a, b) => a.name.localeCompare(b.name))
            : prev.map((p) => p.id === event.record.id ? event.record : p)
        )
      }
    })

    const unsubContractors = subscribeToContractorChanges((event) => {
      if (event.eventType === 'DELETE') {
        setContractors((prev) => prev.filter((c) => c.id !== event.id))
        setContractorDeleteState((prev) => prev?.id === event.id ? null : prev)
      } else {
        setContractors((prev) =>
          event.eventType === 'INSERT'
            ? prev.some((c) => c.id === event.record.id)
              ? prev
              : [...prev, event.record].sort((a, b) => a.name.localeCompare(b.name))
            : prev.map((c) => c.id === event.record.id ? event.record : c)
        )
      }
    })

    listRooms()
      .then(setRooms)
      .catch(() => setRoomsError('Failed to load rooms'))
      .finally(() => setRoomsLoading(false))

    const unsubRooms = subscribeToRoomChanges((event) => {
      if (event.eventType === 'DELETE') {
        setRooms((prev) => prev.filter((r) => r.id !== event.id))
        setRoomDeleteState((prev) => prev?.id === event.id ? null : prev)
      } else {
        setRooms((prev) =>
          event.eventType === 'INSERT'
            ? prev.some((r) => r.id === event.record.id)
              ? prev
              : [...prev, event.record].sort((a, b) => a.name.localeCompare(b.name))
            : prev.map((r) => r.id === event.record.id ? event.record : r)
        )
      }
    })

    return () => { unsubProjects(); unsubContractors(); unsubRooms() }
  }, [])

  // --- Project handlers ---

  async function handleProjectDeleteClick(project: Project) {
    setProjectDeleteState({ id: project.id, kind: 'checking' })
    try {
      const count = await countTasksByProject(project.id)
      setProjectDeleteState(
        count > 0
          ? { id: project.id, kind: 'hard-confirm', input: '', taskCount: count }
          : { id: project.id, kind: 'confirm' }
      )
    } catch {
      setProjectsError('Failed to check project tasks')
      setProjectDeleteState(null)
    }
  }

  async function handleProjectConfirmDelete(id: string) {
    setProjectDeleting(true)
    try {
      await deleteProject(id)
      setProjects((prev) => prev.filter((p) => p.id !== id))
      setProjectDeleteState(null)
      showToast('Project deleted')
    } catch {
      setProjectsError('Failed to delete project')
    } finally {
      setProjectDeleting(false)
    }
  }

  function handleProjectSaved(project: Project, isEdit: boolean) {
    setProjects((prev) =>
      isEdit
        ? prev.map((p) => (p.id === project.id ? project : p))
        : [...prev, project].sort((a, b) => a.name.localeCompare(b.name))
    )
    showToast(isEdit ? 'Project saved' : 'Project created')
    setView({ kind: 'list' })
  }

  // --- Contractor handlers ---

  async function handleContractorDeleteClick(contractor: Contractor) {
    setContractorDeleteState({ id: contractor.id, kind: 'checking' })
    try {
      const count = await countTasksByContractor(contractor.id)
      setContractorDeleteState(
        count > 0
          ? { id: contractor.id, kind: 'blocked', count }
          : { id: contractor.id, kind: 'confirm' }
      )
    } catch {
      setContractorsError('Failed to check contractor usage')
      setContractorDeleteState(null)
    }
  }

  async function handleContractorConfirmDelete(id: string) {
    setContractorDeleting(true)
    try {
      await deleteContractor(id)
      setContractors((prev) => prev.filter((c) => c.id !== id))
      setContractorDeleteState(null)
      showToast('Contractor deleted')
    } catch {
      setContractorsError('Failed to delete contractor')
    } finally {
      setContractorDeleting(false)
    }
  }

  function handleContractorSaved(contractor: Contractor, isEdit: boolean) {
    setContractors((prev) =>
      isEdit
        ? prev.map((c) => (c.id === contractor.id ? contractor : c))
        : [...prev, contractor].sort((a, b) => a.name.localeCompare(b.name))
    )
    showToast(isEdit ? 'Contractor saved' : 'Contractor created')
    setView({ kind: 'list' })
  }

  // --- Room handlers ---

  function handleCancelAddRoom() {
    setShowRoomAddForm(false)
    setAddRoomName('')
    setAddRoomColor('')
    setAddRoomSaving(false)
  }

  async function handleCreateRoom() {
    setAddRoomSaving(true)
    try {
      const room = await createRoom({ name: addRoomName.trim(), color: addRoomColor })
      setRooms((prev) =>
        prev.some((r) => r.id === room.id)
          ? prev
          : [...prev, room].sort((a, b) => a.name.localeCompare(b.name))
      )
      showToast('Room added')
      handleCancelAddRoom()
    } catch {
      setRoomsError('Failed to create room')
      setAddRoomSaving(false)
    }
  }

  async function handleRoomSave(es: RoomEditState) {
    setRoomEditState({ ...es, saving: true })
    try {
      const updated = await updateRoom(es.id, { name: es.name.trim(), color: es.color })
      setRooms((prev) => prev.map((r) => r.id === updated.id ? updated : r))
      setRoomEditState(null)
      showToast('Room saved')
    } catch {
      setRoomsError('Failed to save room')
      setRoomEditState({ ...es, saving: false })
    }
  }

  async function handleRoomConfirmDelete(id: string) {
    setRoomDeleting(true)
    try {
      await deleteRoom(id)
      setRooms((prev) => prev.filter((r) => r.id !== id))
      setRoomDeleteState(null)
      showToast('Room deleted')
    } catch {
      setRoomsError('Failed to delete room')
    } finally {
      setRoomDeleting(false)
    }
  }

  // --- Form routing ---

  if (view.kind === 'project-form') {
    return (
      <ProjectForm
        project={view.project}
        onBack={() => setView({ kind: 'list' })}
        onSaved={(p) => handleProjectSaved(p, view.project != null)}
      />
    )
  }

  if (view.kind === 'contractor-form') {
    return (
      <ContractorForm
        contractor={view.contractor}
        onBack={() => setView({ kind: 'list' })}
        onSaved={(c) => handleContractorSaved(c, view.contractor != null)}
      />
    )
  }

  return (
    <div className="settings">
      <div className="page-header">
        <h2 className="page-title">Settings</h2>
        <button className="btn-icon" onClick={onBack} aria-label="Close">
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>

      {/* Appearance section */}
      <section className="settings-section">
        <h3 className="settings-section-title">Appearance</h3>
        <div className="settings-theme-toggle">
          {([
            { value: 'auto',  icon: faMobileScreen,      label: 'Auto'  },
            { value: 'light', icon: faSun,               label: 'Light' },
            { value: 'dark',  icon: faMoon,              label: 'Dark'  },
          ] as const).map(({ value, icon, label }) => (
            <button
              key={value}
              className={`settings-theme-btn${theme === value ? ' active' : ''}`}
              onClick={() => { setTheme(value); applyTheme(value) }}
            >
              <FontAwesomeIcon icon={icon} />
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Projects section */}
      <section className="settings-section">
        <div className="settings-section-header">
          <h3 className="settings-section-title">Projects</h3>
          <button
            aria-label="Add project"
            className="btn-outline"
            onClick={() => { setProjectDeleteState(null); setView({ kind: 'project-form' }) }}
          >
            + Add
          </button>
        </div>

        {projectsError && <p className="settings-message settings-message--error">{projectsError}</p>}
        {projectsLoading && <p className="settings-message">Loading…</p>}
        {!projectsLoading && projects.length === 0 && !projectsError && (
          <p className="settings-message">No projects yet.</p>
        )}

        <ul className="settings-list">
          {projects.map((p) => {
            const ds = projectDeleteState?.id === p.id ? projectDeleteState : null
            return (
              <li key={p.id} className="settings-list-item">
                {ds?.kind === 'confirm' ? (
                  <div className="settings-item-state">
                    <span className="settings-item-confirm-msg">Delete {p.name}?</span>
                    <div className="settings-item-confirm-actions">
                      <button className="btn-ghost" onClick={() => setProjectDeleteState(null)}>Cancel</button>
                      <button className="btn-danger" onClick={() => handleProjectConfirmDelete(p.id)} disabled={projectDeleting}>
                        {projectDeleting ? '…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ) : ds?.kind === 'hard-confirm' ? (
                  <div className="settings-item-hard-confirm">
                    <span className="settings-item-block-msg">
                      This will permanently delete {ds.taskCount} task{ds.taskCount > 1 ? 's' : ''}. Type &ldquo;delete&rdquo; to confirm.
                    </span>
                    <div className="settings-item-hard-confirm-row">
                      <input
                        className="input"
                        type="text"
                        placeholder="delete"
                        value={ds.input}
                        onChange={(e) => setProjectDeleteState({ ...ds, input: e.target.value })}
                      />
                      <button className="btn-ghost" onClick={() => setProjectDeleteState(null)}>Cancel</button>
                      <button
                        className="btn-danger"
                        onClick={() => handleProjectConfirmDelete(p.id)}
                        disabled={ds.input !== 'delete' || projectDeleting}
                      >
                        {projectDeleting ? '…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="settings-item-info">
                      <span className="settings-item-name">{p.name}</span>
                      {p.description && (
                        <span className="settings-item-details">{p.description}</span>
                      )}
                    </div>
                    <div className="settings-item-actions">
                      <button
                        className="btn-icon"
                        onClick={() => { setProjectDeleteState(null); setView({ kind: 'project-form', project: p }) }}
                        aria-label={`Edit ${p.name}`}
                      >
                        <FontAwesomeIcon icon={faPen} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => handleProjectDeleteClick(p)}
                        disabled={ds?.kind === 'checking'}
                        aria-label={`Delete ${p.name}`}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      {/* Rooms section */}
      <section className="settings-section">
        <div className="settings-section-header">
          <h3 className="settings-section-title">Rooms</h3>
          {!showRoomAddForm && (
            <button
              aria-label="Add room"
              className="btn-outline"
              onClick={() => { setRoomDeleteState(null); setRoomEditState(null); setShowRoomAddForm(true) }}
            >
              + Add
            </button>
          )}
        </div>

        {roomsError && <p className="settings-message settings-message--error">{roomsError}</p>}
        {roomsLoading && <p className="settings-message">Loading…</p>}

        {showRoomAddForm && (
          <div className="room-inline-form">
            <div className="room-inline-form-fields">
              <input
                className="input"
                type="text"
                placeholder="Room name"
                aria-label="Room name"
                value={addRoomName}
                onChange={(e) => setAddRoomName(e.target.value)}
              />
              <div className="room-palette" role="group" aria-label="Color">
                {ROOM_PALETTE.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`room-palette-swatch${addRoomColor === color ? ' selected' : ''}`}
                    style={{ backgroundColor: color }}
                    aria-label={color}
                    aria-pressed={addRoomColor === color}
                    onClick={() => setAddRoomColor(color)}
                  />
                ))}
              </div>
            </div>
            <div className="room-inline-form-actions">
              <button className="btn-ghost" onClick={handleCancelAddRoom}>Cancel</button>
              <button
                className="btn-primary"
                onClick={handleCreateRoom}
                disabled={addRoomSaving || !addRoomName.trim() || !addRoomColor}
              >
                {addRoomSaving ? '…' : 'Add'}
              </button>
            </div>
          </div>
        )}

        {!roomsLoading && rooms.length === 0 && !roomsError && !showRoomAddForm && (
          <p className="settings-message">No rooms yet.</p>
        )}

        <ul className="settings-list">
          {rooms.map((r) => {
            const ds = roomDeleteState?.id === r.id ? roomDeleteState : null
            const es = roomEditState?.id === r.id ? roomEditState : null
            return (
              <li key={r.id} className="settings-list-item">
                {ds ? (
                  <div className="settings-item-state">
                    <span className="settings-item-confirm-msg">Delete {r.name}?</span>
                    <div className="settings-item-confirm-actions">
                      <button className="btn-ghost" onClick={() => setRoomDeleteState(null)}>Cancel</button>
                      <button
                        className="btn-danger"
                        onClick={() => handleRoomConfirmDelete(r.id)}
                        disabled={roomDeleting}
                      >
                        {roomDeleting ? '…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ) : es ? (
                  <div className="settings-item-hard-confirm">
                    <div className="room-inline-form-fields">
                      <input
                        className="input"
                        type="text"
                        aria-label="Room name"
                        value={es.name}
                        onChange={(e) => setRoomEditState({ ...es, name: e.target.value })}
                      />
                      <div className="room-palette" role="group" aria-label="Color">
                        {ROOM_PALETTE.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={`room-palette-swatch${es.color === color ? ' selected' : ''}`}
                            style={{ backgroundColor: color }}
                            aria-label={color}
                            aria-pressed={es.color === color}
                            onClick={() => setRoomEditState({ ...es, color })}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="room-inline-form-actions">
                      <button className="btn-ghost" onClick={() => setRoomEditState(null)}>Cancel</button>
                      <button
                        className="btn-primary"
                        onClick={() => handleRoomSave(es)}
                        disabled={es.saving || !es.name.trim() || !es.color}
                      >
                        {es.saving ? '…' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="room-item-info">
                      <span className="room-color-dot" style={{ backgroundColor: r.color }} aria-hidden="true" />
                      <span className="settings-item-name">{r.name}</span>
                    </div>
                    <div className="settings-item-actions">
                      <button
                        className="btn-icon"
                        onClick={() => { setRoomDeleteState(null); setShowRoomAddForm(false); setRoomEditState({ id: r.id, name: r.name, color: r.color, saving: false }) }}
                        aria-label={`Edit ${r.name}`}
                      >
                        <FontAwesomeIcon icon={faPen} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => { setRoomEditState(null); setRoomDeleteState({ id: r.id }) }}
                        aria-label={`Delete ${r.name}`}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      {/* Contractors section */}
      <section className="settings-section">
        <div className="settings-section-header">
          <h3 className="settings-section-title">Contractors</h3>
          <button
            aria-label="Add contractor"
            className="btn-outline"
            onClick={() => { setContractorDeleteState(null); setView({ kind: 'contractor-form' }) }}
          >
            + Add
          </button>
        </div>

        {contractorsError && <p className="settings-message settings-message--error">{contractorsError}</p>}
        {contractorsLoading && <p className="settings-message">Loading…</p>}
        {!contractorsLoading && contractors.length === 0 && !contractorsError && (
          <p className="settings-message">No contractors yet.</p>
        )}

        <ul className="settings-list">
          {contractors.map((c) => {
            const ds = contractorDeleteState?.id === c.id ? contractorDeleteState : null
            return (
              <li key={c.id} className="settings-list-item">
                {ds?.kind === 'blocked' ? (
                  <div className="settings-item-state">
                    <span className="settings-item-block-msg">
                      {ds.count} task{ds.count > 1 ? 's are' : ' is'} assigned to this contractor — reassign them before deleting
                    </span>
                    <button className="btn-ghost" onClick={() => setContractorDeleteState(null)}>Dismiss</button>
                  </div>
                ) : ds?.kind === 'confirm' ? (
                  <div className="settings-item-state">
                    <span className="settings-item-confirm-msg">Delete {c.name}?</span>
                    <div className="settings-item-confirm-actions">
                      <button className="btn-ghost" onClick={() => setContractorDeleteState(null)}>Cancel</button>
                      <button className="btn-danger" onClick={() => handleContractorConfirmDelete(c.id)} disabled={contractorDeleting}>
                        {contractorDeleting ? '…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="settings-item-info">
                      <span className="settings-item-name">{c.name}</span>
                      <span className="settings-item-details">
                        {[c.email, c.phone].filter(Boolean).join(' · ')}
                      </span>
                    </div>
                    <div className="settings-item-actions">
                      <button
                        className="btn-icon"
                        onClick={() => { setContractorDeleteState(null); setView({ kind: 'contractor-form', contractor: c }) }}
                        aria-label={`Edit ${c.name}`}
                      >
                        <FontAwesomeIcon icon={faPen} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => handleContractorDeleteClick(c)}
                        disabled={ds?.kind === 'checking'}
                        aria-label={`Delete ${c.name}`}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}

interface ProjectFormProps {
  project?: Project
  onBack: () => void
  onSaved: (project: Project) => void
}

function ProjectForm({ project, onBack, onSaved }: ProjectFormProps) {
  const isEdit = project != null
  const [name, setName]               = useState(project?.name ?? '')
  const [description, setDescription] = useState(project?.description ?? '')
  const [nameError, setNameError]     = useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setNameError(false)
    setError(null)
    if (!name.trim()) { setNameError(true); return }
    setLoading(true)
    try {
      const data: ProjectInsert | ProjectUpdate = {
        name: name.trim(),
        description: description.trim() || null,
      }
      const saved = isEdit
        ? await updateProject(project.id, data as ProjectUpdate)
        : await createProject(data as ProjectInsert)
      onSaved(saved)
    } catch {
      setError(isEdit ? 'Failed to save project' : 'Failed to create project')
      setLoading(false)
    }
  }

  return (
    <div className="settings">
      <div className="page-header">
        <h2 className="page-title">{isEdit ? 'Edit project' : 'New project'}</h2>
        <button className="btn-icon" onClick={onBack} aria-label="Close">
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>

      <form className="settings-form" onSubmit={handleSubmit} noValidate>
        <label className="settings-form-label">
          <span>Name <span className="settings-form-required">*</span></span>
          <input
            className={`input${nameError ? ' settings-form-input--error' : ''}`}
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setNameError(false) }}
          />
          {nameError && <span className="settings-form-field-error">Required</span>}
        </label>

        <label className="settings-form-label">
          <span>Description</span>
          <input
            className="input"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        {error && <p className="settings-form-error">{error}</p>}

        <div className="settings-form-actions">
          <button type="button" className="btn-outline" onClick={onBack} disabled={loading}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '…' : isEdit ? 'Save' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  )
}

interface ContractorFormProps {
  contractor?: Contractor
  onBack: () => void
  onSaved: (contractor: Contractor) => void
}

function ContractorForm({ contractor, onBack, onSaved }: ContractorFormProps) {
  const isEdit = contractor != null
  const [name, setName]   = useState(contractor?.name ?? '')
  const [email, setEmail] = useState(contractor?.email ?? '')
  const [phone, setPhone] = useState(contractor?.phone ?? '')
  const [nameError, setNameError] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setNameError(false)
    setError(null)
    if (!name.trim()) { setNameError(true); return }
    setLoading(true)
    try {
      const data: ContractorInsert | ContractorUpdate = {
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
      }
      const saved = isEdit
        ? await updateContractor(contractor.id, data as ContractorUpdate)
        : await createContractor(data as ContractorInsert)
      onSaved(saved)
    } catch {
      setError(isEdit ? 'Failed to save contractor' : 'Failed to create contractor')
      setLoading(false)
    }
  }

  return (
    <div className="settings">
      <div className="page-header">
        <h2 className="page-title">{isEdit ? 'Edit contractor' : 'New contractor'}</h2>
        <button className="btn-icon" onClick={onBack} aria-label="Close">
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>

      <form className="settings-form" onSubmit={handleSubmit} noValidate>
        <label className="settings-form-label">
          <span>Name <span className="settings-form-required">*</span></span>
          <input
            className={`input${nameError ? ' settings-form-input--error' : ''}`}
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setNameError(false) }}
          />
          {nameError && <span className="settings-form-field-error">Required</span>}
        </label>

        <label className="settings-form-label">
          <span>Email</span>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>

        <label className="settings-form-label">
          <span>Phone</span>
          <input className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>

        {error && <p className="settings-form-error">{error}</p>}

        <div className="settings-form-actions">
          <button type="button" className="btn-outline" onClick={onBack} disabled={loading}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '…' : isEdit ? 'Save' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useToast } from '../context/ToastContext'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPen, faTrash } from '@fortawesome/free-solid-svg-icons'
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

export function Settings({ onBack }: { onBack: () => void }) {
  const { showToast } = useToast()
  const [view, setView] = useState<SettingsView>({ kind: 'list' })

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
            ? [...prev, event.record].sort((a, b) => a.name.localeCompare(b.name))
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
            ? [...prev, event.record].sort((a, b) => a.name.localeCompare(b.name))
            : prev.map((c) => c.id === event.record.id ? event.record : c)
        )
      }
    })

    return () => { unsubProjects(); unsubContractors() }
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

  function handleProjectSaved(_project: Project, isEdit: boolean) {
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

  function handleContractorSaved(_contractor: Contractor, isEdit: boolean) {
    showToast(isEdit ? 'Contractor saved' : 'Contractor created')
    setView({ kind: 'list' })
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
      <div className="settings-toolbar">
        <button className="btn-ghost settings-back" onClick={onBack}>← Board</button>
      </div>

      <h2 className="settings-heading">Settings</h2>

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
      <div className="settings-toolbar">
        <button className="btn-ghost settings-back" onClick={onBack}>← Settings</button>
      </div>

      <h2 className="settings-heading">{isEdit ? 'Edit project' : 'New project'}</h2>

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
      <div className="settings-toolbar">
        <button className="btn-ghost settings-back" onClick={onBack}>← Settings</button>
      </div>

      <h2 className="settings-heading">{isEdit ? 'Edit contractor' : 'New contractor'}</h2>

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

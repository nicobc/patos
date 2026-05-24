import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPen, faTrash } from '@fortawesome/free-solid-svg-icons'
import {
  listContractors,
  createContractor,
  updateContractor,
  deleteContractor,
  countTasksByContractor,
  type Contractor,
  type ContractorInsert,
  type ContractorUpdate,
} from '../services/contractorsService'
import './Settings.css'

type ListView =
  | { kind: 'list' }
  | { kind: 'form'; contractor?: Contractor }

type DeleteState =
  | { id: string; kind: 'checking' }
  | { id: string; kind: 'confirm' }
  | { id: string; kind: 'blocked'; count: number }

export function Settings({ onBack }: { onBack: () => void }) {
  const [view, setView]               = useState<ListView>({ kind: 'list' })
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [deleteState, setDeleteState] = useState<DeleteState | null>(null)
  const [deleting, setDeleting]       = useState(false)

  useEffect(() => {
    listContractors()
      .then(setContractors)
      .catch(() => setError('Failed to load contractors'))
      .finally(() => setLoading(false))
  }, [])

  async function handleDeleteClick(contractor: Contractor) {
    setDeleteState({ id: contractor.id, kind: 'checking' })
    try {
      const count = await countTasksByContractor(contractor.id)
      setDeleteState(
        count > 0
          ? { id: contractor.id, kind: 'blocked', count }
          : { id: contractor.id, kind: 'confirm' }
      )
    } catch {
      setError('Failed to check contractor usage')
      setDeleteState(null)
    }
  }

  async function handleConfirmDelete(id: string) {
    setDeleting(true)
    try {
      await deleteContractor(id)
      setContractors((prev) => prev.filter((c) => c.id !== id))
      setDeleteState(null)
    } catch {
      setError('Failed to delete contractor')
    } finally {
      setDeleting(false)
    }
  }

  function handleSaved(contractor: Contractor, isEdit: boolean) {
    setContractors((prev) =>
      isEdit
        ? prev.map((c) => (c.id === contractor.id ? contractor : c))
        : [...prev, contractor].sort((a, b) => a.name.localeCompare(b.name))
    )
    setView({ kind: 'list' })
  }

  if (view.kind === 'form') {
    return (
      <ContractorForm
        contractor={view.contractor}
        onBack={() => setView({ kind: 'list' })}
        onSaved={(c) => handleSaved(c, view.contractor != null)}
      />
    )
  }

  return (
    <div className="settings">
      <div className="settings-toolbar">
        <button className="btn-ghost settings-back" onClick={onBack}>← Board</button>
      </div>

      <h2 className="settings-heading">Settings</h2>

      <section className="settings-section">
        <div className="settings-section-header">
          <h3 className="settings-section-title">Contractors</h3>
          <button className="btn-outline" onClick={() => { setDeleteState(null); setView({ kind: 'form' }) }}>
            + Add
          </button>
        </div>

        {error && <p className="settings-message settings-message--error">{error}</p>}
        {loading && <p className="settings-message">Loading…</p>}
        {!loading && contractors.length === 0 && !error && (
          <p className="settings-message">No contractors yet.</p>
        )}

        <ul className="settings-list">
          {contractors.map((c) => {
            const ds = deleteState?.id === c.id ? deleteState : null
            return (
              <li key={c.id} className="settings-list-item">
                {ds?.kind === 'blocked' ? (
                  <div className="settings-item-state">
                    <span className="settings-item-block-msg">
                      {ds.count} task{ds.count > 1 ? 's are' : ' is'} assigned to this contractor — reassign them before deleting
                    </span>
                    <button className="btn-ghost" onClick={() => setDeleteState(null)}>Dismiss</button>
                  </div>
                ) : ds?.kind === 'confirm' ? (
                  <div className="settings-item-state">
                    <span className="settings-item-confirm-msg">Delete {c.name}?</span>
                    <div className="settings-item-confirm-actions">
                      <button className="btn-ghost" onClick={() => setDeleteState(null)}>Cancel</button>
                      <button className="btn-danger" onClick={() => handleConfirmDelete(c.id)} disabled={deleting}>
                        {deleting ? '…' : 'Delete'}
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
                        onClick={() => { setDeleteState(null); setView({ kind: 'form', contractor: c }) }}
                        aria-label={`Edit ${c.name}`}
                      >
                        <FontAwesomeIcon icon={faPen} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => handleDeleteClick(c)}
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

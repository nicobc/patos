import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Settings } from './Settings'

vi.mock('../context/useToast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}))

vi.mock('../services/propertiesService', () => ({
  listProperties:              vi.fn(),
  createProperty:              vi.fn(),
  updateProperty:              vi.fn(),
  deleteProperty:              vi.fn(),
  countProjectsByProperty:     vi.fn(),
  subscribeToPropertyChanges:  vi.fn(),
}))

vi.mock('../services/projectsService', () => ({
  listProjects:              vi.fn(),
  createProject:             vi.fn(),
  updateProject:             vi.fn(),
  deleteProject:             vi.fn(),
  countTasksByProject:       vi.fn(),
  subscribeToProjectChanges: vi.fn(),
}))

vi.mock('../services/contractorsService', () => ({
  listContractors:              vi.fn(),
  createContractor:             vi.fn(),
  updateContractor:             vi.fn(),
  deleteContractor:             vi.fn(),
  countTasksByContractor:       vi.fn(),
  subscribeToContractorChanges: vi.fn(),
}))

vi.mock('../services/roomsService', () => ({
  listRooms:              vi.fn(),
  createRoom:             vi.fn(),
  updateRoom:             vi.fn(),
  deleteRoom:             vi.fn(),
  subscribeToRoomChanges: vi.fn(),
}))

import {
  listProperties,
  createProperty,
  updateProperty,
  deleteProperty,
  countProjectsByProperty,
  subscribeToPropertyChanges,
} from '../services/propertiesService'

import {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
  countTasksByProject,
  subscribeToProjectChanges,
} from '../services/projectsService'

import {
  listContractors,
  createContractor,
  updateContractor,
  deleteContractor,
  countTasksByContractor,
  subscribeToContractorChanges,
} from '../services/contractorsService'

import {
  listRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  subscribeToRoomChanges,
} from '../services/roomsService'

const mockListProperties      = vi.mocked(listProperties)
const mockCreateProperty      = vi.mocked(createProperty)
const mockUpdateProperty      = vi.mocked(updateProperty)
const mockDeleteProperty      = vi.mocked(deleteProperty)
const mockCountByProperty     = vi.mocked(countProjectsByProperty)
const mockSubProperties       = vi.mocked(subscribeToPropertyChanges)

const mockListProjects        = vi.mocked(listProjects)
const mockCreateProject       = vi.mocked(createProject)
const mockUpdateProject       = vi.mocked(updateProject)
const mockDeleteProject       = vi.mocked(deleteProject)
const mockCountByProject      = vi.mocked(countTasksByProject)
const mockSubProjects         = vi.mocked(subscribeToProjectChanges)

const mockListContractors     = vi.mocked(listContractors)
const mockCreateContractor    = vi.mocked(createContractor)
const mockUpdateContractor    = vi.mocked(updateContractor)
const mockDeleteContractor    = vi.mocked(deleteContractor)
const mockCountByContractor   = vi.mocked(countTasksByContractor)
const mockSubContractors      = vi.mocked(subscribeToContractorChanges)

const mockListRooms    = vi.mocked(listRooms)
const mockCreateRoom   = vi.mocked(createRoom)
const mockUpdateRoom   = vi.mocked(updateRoom)
const mockDeleteRoom   = vi.mocked(deleteRoom)
const mockSubRooms     = vi.mocked(subscribeToRoomChanges)

const prop1 = { id: 'pr1', name: 'Flat 4B',  created_at: '', updated_at: '' }
const prop2 = { id: 'pr2', name: 'Office',   created_at: '', updated_at: '' }
const proj1 = { id: 'p1', name: 'Full Reno',   description: 'Complete overhaul', property_id: 'pr1', created_at: '', updated_at: '' }
const proj2 = { id: 'p2', name: 'Quick Fixes', description: null,                property_id: 'pr1', created_at: '', updated_at: '' }
const alice   = { id: 'c1', name: 'Alice', email: 'alice@example.com', phone: null,       created_at: '', updated_at: '' }
const bob     = { id: 'c2', name: 'Bob',   email: null,                phone: '555-1234', created_at: '', updated_at: '' }
const kitchen  = { id: 'r1', name: 'Kitchen',  color: '#e74c3c', property_id: 'pr1', created_at: '', updated_at: '' }
const bathroom = { id: 'r2', name: 'Bathroom', color: '#3498db', property_id: 'pr1', created_at: '', updated_at: '' }

beforeEach(() => {
  vi.clearAllMocks()
  mockListProperties.mockResolvedValue([prop1, prop2])
  mockCountByProperty.mockResolvedValue(0)
  mockSubProperties.mockReturnValue(vi.fn())
  mockListProjects.mockResolvedValue([proj1, proj2])
  mockCountByProject.mockResolvedValue(0)
  mockSubProjects.mockReturnValue(vi.fn())
  mockListContractors.mockResolvedValue([alice, bob])
  mockCountByContractor.mockResolvedValue(0)
  mockSubContractors.mockReturnValue(vi.fn())
  mockListRooms.mockResolvedValue([kitchen, bathroom])
  mockSubRooms.mockReturnValue(vi.fn())
})

// ─── Properties list ──────────────────────────────────────────────────────────

describe('Settings — properties list', () => {
  it('renders property names after load', async () => {
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => expect(screen.getByText('Flat 4B')).toBeInTheDocument())
    expect(screen.getByText('Office')).toBeInTheDocument()
  })

  it('shows empty state when no properties', async () => {
    mockListProperties.mockResolvedValue([])
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => expect(screen.getByText(/no properties yet/i)).toBeInTheDocument())
  })

  it('shows error when property fetch fails', async () => {
    mockListProperties.mockRejectedValue(new Error('fail'))
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => expect(screen.getByText(/failed to load properties/i)).toBeInTheDocument())
  })

  it('calls onBack when close is clicked', async () => {
    const onBack = vi.fn()
    render(<Settings onBack={onBack} />)
    await userEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onBack).toHaveBeenCalled()
  })
})

// ─── Add property ─────────────────────────────────────────────────────────────

describe('Settings — add property', () => {
  it('shows the property form when Add property is clicked', async () => {
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Flat 4B'))
    await userEvent.click(screen.getByRole('button', { name: /add property/i }))
    expect(screen.getByRole('heading', { name: /new property/i })).toBeInTheDocument()
  })

  it('creates a property and returns to list', async () => {
    const newProp = { id: 'pr3', name: 'Studio', created_at: '', updated_at: '' }
    mockCreateProperty.mockResolvedValue(newProp)
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Flat 4B'))

    await userEvent.click(screen.getByRole('button', { name: /add property/i }))
    await userEvent.type(screen.getByRole('textbox', { name: /name/i }), 'Studio')
    await userEvent.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => expect(screen.getByText('Studio')).toBeInTheDocument())
    expect(mockCreateProperty).toHaveBeenCalledWith(expect.objectContaining({ name: 'Studio' }))
  })

  it('blocks form submission when name is empty', async () => {
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Flat 4B'))
    await userEvent.click(screen.getByRole('button', { name: /add property/i }))
    await userEvent.click(screen.getByRole('button', { name: /create/i }))
    expect(screen.getByText(/required/i)).toBeInTheDocument()
    expect(mockCreateProperty).not.toHaveBeenCalled()
  })
})

// ─── Edit property ────────────────────────────────────────────────────────────

describe('Settings — edit property', () => {
  it('shows the property form pre-filled when Edit is clicked', async () => {
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Flat 4B'))
    await userEvent.click(screen.getByRole('button', { name: /edit flat 4b/i }))
    expect(screen.getByRole('heading', { name: /edit property/i })).toBeInTheDocument()
    expect(screen.getByDisplayValue('Flat 4B')).toBeInTheDocument()
  })

  it('updates a property and returns to list', async () => {
    const updated = { ...prop1, name: 'Flat 4B Renovated' }
    mockUpdateProperty.mockResolvedValue(updated)
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Flat 4B'))

    await userEvent.click(screen.getByRole('button', { name: /edit flat 4b/i }))
    const nameInput = screen.getByDisplayValue('Flat 4B')
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'Flat 4B Renovated')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => expect(screen.getByText('Flat 4B Renovated')).toBeInTheDocument())
    expect(mockUpdateProperty).toHaveBeenCalledWith('pr1', expect.objectContaining({ name: 'Flat 4B Renovated' }))
  })
})

// ─── Delete property ──────────────────────────────────────────────────────────

describe('Settings — delete property', () => {
  it('shows confirmation when property has no projects', async () => {
    mockCountByProperty.mockResolvedValue(0)
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Flat 4B'))
    await userEvent.click(screen.getByRole('button', { name: /delete flat 4b/i }))
    await waitFor(() => expect(screen.getByText(/delete flat 4b and all its rooms\?/i)).toBeInTheDocument())
  })

  it('deletes property on confirm and removes from list', async () => {
    mockCountByProperty.mockResolvedValue(0)
    mockDeleteProperty.mockResolvedValue(undefined)
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Flat 4B'))
    await userEvent.click(screen.getByRole('button', { name: /delete flat 4b/i }))
    await waitFor(() => screen.getByText(/delete flat 4b and all its rooms\?/i))
    await userEvent.click(screen.getByRole('button', { name: /^delete$/i }))
    await waitFor(() => expect(screen.queryByText('Flat 4B')).not.toBeInTheDocument())
    expect(mockDeleteProperty).toHaveBeenCalledWith('pr1')
  })

  it('cancels confirm without deleting', async () => {
    mockCountByProperty.mockResolvedValue(0)
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Flat 4B'))
    await userEvent.click(screen.getByRole('button', { name: /delete flat 4b/i }))
    await waitFor(() => screen.getByText(/delete flat 4b and all its rooms\?/i))
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByText(/delete flat 4b and all its rooms\?/i)).not.toBeInTheDocument()
    expect(mockDeleteProperty).not.toHaveBeenCalled()
  })

  it('shows block message when property has projects', async () => {
    mockCountByProperty.mockResolvedValue(2)
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Flat 4B'))
    await userEvent.click(screen.getByRole('button', { name: /delete flat 4b/i }))
    await waitFor(() => expect(screen.getByText(/2 projects use this property/i)).toBeInTheDocument())
    expect(mockDeleteProperty).not.toHaveBeenCalled()
  })

  it('dismisses block message when Dismiss is clicked', async () => {
    mockCountByProperty.mockResolvedValue(1)
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Flat 4B'))
    await userEvent.click(screen.getByRole('button', { name: /delete flat 4b/i }))
    await waitFor(() => screen.getByText(/1 project uses this property/i))
    await userEvent.click(screen.getByRole('button', { name: /dismiss/i }))
    expect(screen.queryByText(/project uses this property/i)).not.toBeInTheDocument()
  })
})

// ─── PropertyForm — rooms section ─────────────────────────────────────────────

describe('Settings — property rooms', () => {
  it('shows rooms section in edit mode', async () => {
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Flat 4B'))
    await userEvent.click(screen.getByRole('button', { name: /edit flat 4b/i }))
    await waitFor(() => expect(screen.getByText('Kitchen')).toBeInTheDocument())
    expect(screen.getByText('Bathroom')).toBeInTheDocument()
  })

  it('does not show rooms section in create mode', async () => {
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Flat 4B'))
    await userEvent.click(screen.getByRole('button', { name: /add property/i }))
    expect(screen.queryByText(/rooms/i)).not.toBeInTheDocument()
  })

  it('shows empty state when property has no rooms', async () => {
    mockListRooms.mockResolvedValue([])
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Flat 4B'))
    await userEvent.click(screen.getByRole('button', { name: /edit flat 4b/i }))
    await waitFor(() => expect(screen.getByText(/no rooms yet/i)).toBeInTheDocument())
  })

  it('creates a room scoped to the property', async () => {
    const newRoom = { id: 'r3', name: 'Living Room', color: '#e74c3c', property_id: 'pr1', created_at: '', updated_at: '' }
    mockCreateRoom.mockResolvedValue(newRoom)
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Flat 4B'))
    await userEvent.click(screen.getByRole('button', { name: /edit flat 4b/i }))
    await waitFor(() => screen.getByRole('button', { name: /add room/i }))

    await userEvent.click(screen.getByRole('button', { name: /add room/i }))
    await userEvent.type(screen.getByRole('textbox', { name: /room name/i }), 'Living Room')
    await userEvent.click(screen.getByRole('button', { name: '#e74c3c' }))
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }))

    await waitFor(() => expect(screen.getByText('Living Room')).toBeInTheDocument())
    expect(mockCreateRoom).toHaveBeenCalledWith(expect.objectContaining({ name: 'Living Room', property_id: 'pr1' }))
  })

  it('saves an updated room', async () => {
    const updated = { ...kitchen, name: 'Main Kitchen' }
    mockUpdateRoom.mockResolvedValue(updated)
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Flat 4B'))
    await userEvent.click(screen.getByRole('button', { name: /edit flat 4b/i }))
    await waitFor(() => screen.getByRole('button', { name: /edit kitchen/i }))

    await userEvent.click(screen.getByRole('button', { name: /edit kitchen/i }))
    const nameInput = screen.getByRole('textbox', { name: /room name/i })
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'Main Kitchen')
    // two Save buttons present: property form + room inline edit; click the room one (last)
    const saveBtns = screen.getAllByRole('button', { name: /^save$/i })
    await userEvent.click(saveBtns[saveBtns.length - 1])

    await waitFor(() => expect(screen.getByText('Main Kitchen')).toBeInTheDocument())
    expect(mockUpdateRoom).toHaveBeenCalledWith('r1', expect.objectContaining({ name: 'Main Kitchen' }))
  })

  it('deletes a room on confirm', async () => {
    mockDeleteRoom.mockResolvedValue(undefined)
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Flat 4B'))
    await userEvent.click(screen.getByRole('button', { name: /edit flat 4b/i }))
    await waitFor(() => screen.getByRole('button', { name: /delete kitchen/i }))

    await userEvent.click(screen.getByRole('button', { name: /delete kitchen/i }))
    await userEvent.click(screen.getByRole('button', { name: /^delete$/i }))
    await waitFor(() => expect(screen.queryByText('Kitchen')).not.toBeInTheDocument())
    expect(mockDeleteRoom).toHaveBeenCalledWith('r1')
  })
})

// ─── Projects list ────────────────────────────────────────────────────────────

describe('Settings — project list', () => {
  it('renders project names after load', async () => {
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => expect(screen.getByText('Full Reno')).toBeInTheDocument())
    expect(screen.getByText('Quick Fixes')).toBeInTheDocument()
  })

  it('shows description when present', async () => {
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => expect(screen.getByText('Complete overhaul')).toBeInTheDocument())
  })

  it('shows empty state when no projects', async () => {
    mockListProjects.mockResolvedValue([])
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => expect(screen.getByText(/no projects yet/i)).toBeInTheDocument())
  })

  it('shows error when project fetch fails', async () => {
    mockListProjects.mockRejectedValue(new Error('fail'))
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => expect(screen.getByText(/failed to load projects/i)).toBeInTheDocument())
  })
})

// ─── Add project ─────────────────────────────────────────────────────────────

describe('Settings — add project', () => {
  it('shows the project form when Add project is clicked', async () => {
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Full Reno'))
    await userEvent.click(screen.getByRole('button', { name: /add project/i }))
    expect(screen.getByRole('heading', { name: /new project/i })).toBeInTheDocument()
  })

  it('creates a project with a selected property and returns to list', async () => {
    const newProject = { id: 'p3', name: 'Garden', description: null, property_id: 'pr1', created_at: '', updated_at: '' }
    mockCreateProject.mockResolvedValue(newProject)
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Full Reno'))

    await userEvent.click(screen.getByRole('button', { name: /add project/i }))
    await userEvent.type(screen.getByRole('textbox', { name: /name/i }), 'Garden')
    await userEvent.selectOptions(screen.getByRole('combobox', { name: /property/i }), 'pr1')
    await userEvent.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => expect(screen.getByText('Garden')).toBeInTheDocument())
    expect(mockCreateProject).toHaveBeenCalledWith(expect.objectContaining({ name: 'Garden', property_id: 'pr1' }))
  })

  it('blocks submission when name is empty', async () => {
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Full Reno'))
    await userEvent.click(screen.getByRole('button', { name: /add project/i }))
    await userEvent.selectOptions(screen.getByRole('combobox', { name: /property/i }), 'pr1')
    await userEvent.click(screen.getByRole('button', { name: /create/i }))
    expect(screen.getByText(/required/i)).toBeInTheDocument()
    expect(mockCreateProject).not.toHaveBeenCalled()
  })

  it('blocks submission when no property is selected', async () => {
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Full Reno'))
    await userEvent.click(screen.getByRole('button', { name: /add project/i }))
    await userEvent.type(screen.getByRole('textbox', { name: /name/i }), 'Garden')
    await userEvent.click(screen.getByRole('button', { name: /create/i }))
    expect(screen.getAllByText(/required/i).length).toBeGreaterThan(0)
    expect(mockCreateProject).not.toHaveBeenCalled()
  })

  it('shows note and disables Create when no properties exist', async () => {
    mockListProperties.mockResolvedValue([])
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Full Reno'))
    await userEvent.click(screen.getByRole('button', { name: /add project/i }))
    expect(screen.getByText(/no properties yet/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create/i })).toBeDisabled()
  })
})

// ─── Edit project ─────────────────────────────────────────────────────────────

describe('Settings — edit project', () => {
  it('shows the project form pre-filled when Edit is clicked', async () => {
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Full Reno'))
    await userEvent.click(screen.getByRole('button', { name: /edit full reno/i }))
    expect(screen.getByRole('heading', { name: /edit project/i })).toBeInTheDocument()
    expect(screen.getByDisplayValue('Full Reno')).toBeInTheDocument()
  })

  it('pre-selects the current property', async () => {
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Full Reno'))
    await userEvent.click(screen.getByRole('button', { name: /edit full reno/i }))
    await waitFor(() => {
      const select = screen.getByRole('combobox', { name: /property/i }) as HTMLSelectElement
      expect(select.value).toBe('pr1')
    })
  })

  it('updates a project and returns to list', async () => {
    const updated = { ...proj1, name: 'Full Reno v2' }
    mockUpdateProject.mockResolvedValue(updated)
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Full Reno'))

    await userEvent.click(screen.getByRole('button', { name: /edit full reno/i }))
    const nameInput = screen.getByDisplayValue('Full Reno')
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'Full Reno v2')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => expect(screen.getByText('Full Reno v2')).toBeInTheDocument())
    expect(mockUpdateProject).toHaveBeenCalledWith('p1', expect.objectContaining({ name: 'Full Reno v2' }))
  })
})

// ─── Delete project ───────────────────────────────────────────────────────────

describe('Settings — delete project (soft confirm)', () => {
  it('shows soft confirmation when project has no tasks', async () => {
    mockCountByProject.mockResolvedValue(0)
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Full Reno'))
    await userEvent.click(screen.getByRole('button', { name: /delete full reno/i }))
    await waitFor(() => expect(screen.getByText(/delete full reno\?/i)).toBeInTheDocument())
  })

  it('deletes project on soft confirm and removes from list', async () => {
    mockCountByProject.mockResolvedValue(0)
    mockDeleteProject.mockResolvedValue(undefined)
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Full Reno'))
    await userEvent.click(screen.getByRole('button', { name: /delete full reno/i }))
    await waitFor(() => screen.getByText(/delete full reno\?/i))
    await userEvent.click(screen.getByRole('button', { name: /^delete$/i }))
    await waitFor(() => expect(screen.queryByText('Full Reno')).not.toBeInTheDocument())
    expect(mockDeleteProject).toHaveBeenCalledWith('p1')
  })

  it('cancels soft confirm without deleting', async () => {
    mockCountByProject.mockResolvedValue(0)
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Full Reno'))
    await userEvent.click(screen.getByRole('button', { name: /delete full reno/i }))
    await waitFor(() => screen.getByText(/delete full reno\?/i))
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByText(/delete full reno\?/i)).not.toBeInTheDocument()
    expect(mockDeleteProject).not.toHaveBeenCalled()
  })
})

describe('Settings — delete project (hard confirm)', () => {
  it('shows hard confirmation when project has tasks', async () => {
    mockCountByProject.mockResolvedValue(3)
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Full Reno'))
    await userEvent.click(screen.getByRole('button', { name: /delete full reno/i }))
    await waitFor(() => expect(screen.getByText(/permanently delete 3 tasks/i)).toBeInTheDocument())
    expect(screen.getByPlaceholderText('delete')).toBeInTheDocument()
  })

  it('delete button disabled until "delete" is typed', async () => {
    mockCountByProject.mockResolvedValue(2)
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Full Reno'))
    await userEvent.click(screen.getByRole('button', { name: /delete full reno/i }))
    await waitFor(() => screen.getByPlaceholderText('delete'))
    const confirmBtn = screen.getByRole('button', { name: /^delete$/i })
    expect(confirmBtn).toBeDisabled()
    await userEvent.type(screen.getByPlaceholderText('delete'), 'delete')
    expect(confirmBtn).not.toBeDisabled()
  })

  it('deletes project after typing "delete" and confirming', async () => {
    mockCountByProject.mockResolvedValue(2)
    mockDeleteProject.mockResolvedValue(undefined)
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Full Reno'))
    await userEvent.click(screen.getByRole('button', { name: /delete full reno/i }))
    await waitFor(() => screen.getByPlaceholderText('delete'))
    await userEvent.type(screen.getByPlaceholderText('delete'), 'delete')
    await userEvent.click(screen.getByRole('button', { name: /^delete$/i }))
    await waitFor(() => expect(screen.queryByText('Full Reno')).not.toBeInTheDocument())
    expect(mockDeleteProject).toHaveBeenCalledWith('p1')
  })

  it('cancels hard confirm without deleting', async () => {
    mockCountByProject.mockResolvedValue(1)
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Full Reno'))
    await userEvent.click(screen.getByRole('button', { name: /delete full reno/i }))
    await waitFor(() => screen.getByPlaceholderText('delete'))
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByPlaceholderText('delete')).not.toBeInTheDocument()
    expect(mockDeleteProject).not.toHaveBeenCalled()
  })
})

// ─── Contractors list ─────────────────────────────────────────────────────────

describe('Settings — contractor list', () => {
  it('renders contractor names after load', async () => {
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument())
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('shows email and phone details', async () => {
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => expect(screen.getByText(/alice@example\.com/)).toBeInTheDocument())
    expect(screen.getByText(/555-1234/)).toBeInTheDocument()
  })

  it('shows empty state when no contractors', async () => {
    mockListContractors.mockResolvedValue([])
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => expect(screen.getByText(/no contractors yet/i)).toBeInTheDocument())
  })

  it('shows error when contractor fetch fails', async () => {
    mockListContractors.mockRejectedValue(new Error('fail'))
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => expect(screen.getByText(/failed to load contractors/i)).toBeInTheDocument())
  })
})

// ─── Add contractor ───────────────────────────────────────────────────────────

describe('Settings — add contractor', () => {
  it('shows the contractor form when Add contractor is clicked', async () => {
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Alice'))
    await userEvent.click(screen.getByRole('button', { name: /add contractor/i }))
    expect(screen.getByRole('heading', { name: /new contractor/i })).toBeInTheDocument()
  })

  it('creates a contractor and returns to list', async () => {
    const newContractor = { ...alice, id: 'c3', name: 'Carol', email: null, phone: null }
    mockCreateContractor.mockResolvedValue(newContractor)
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Alice'))

    await userEvent.click(screen.getByRole('button', { name: /add contractor/i }))
    await userEvent.type(screen.getByRole('textbox', { name: /name/i }), 'Carol')
    await userEvent.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => expect(screen.getByText('Carol')).toBeInTheDocument())
    expect(mockCreateContractor).toHaveBeenCalledWith(expect.objectContaining({ name: 'Carol' }))
  })

  it('blocks form submission when name is empty', async () => {
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Alice'))
    await userEvent.click(screen.getByRole('button', { name: /add contractor/i }))
    await userEvent.click(screen.getByRole('button', { name: /create/i }))
    expect(screen.getByText(/required/i)).toBeInTheDocument()
    expect(mockCreateContractor).not.toHaveBeenCalled()
  })
})

// ─── Edit contractor ──────────────────────────────────────────────────────────

describe('Settings — edit contractor', () => {
  it('shows the contractor form pre-filled when Edit is clicked', async () => {
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Alice'))
    await userEvent.click(screen.getByRole('button', { name: /edit alice/i }))
    expect(screen.getByRole('heading', { name: /edit contractor/i })).toBeInTheDocument()
    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument()
  })

  it('updates a contractor and returns to list', async () => {
    const updated = { ...alice, name: 'Alice B.' }
    mockUpdateContractor.mockResolvedValue(updated)
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Alice'))

    await userEvent.click(screen.getByRole('button', { name: /edit alice/i }))
    const nameInput = screen.getByDisplayValue('Alice')
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'Alice B.')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => expect(screen.getByText('Alice B.')).toBeInTheDocument())
    expect(mockUpdateContractor).toHaveBeenCalledWith('c1', expect.objectContaining({ name: 'Alice B.' }))
  })
})

// ─── Delete contractor ────────────────────────────────────────────────────────

describe('Settings — delete contractor', () => {
  it('shows confirmation when contractor has no tasks', async () => {
    mockCountByContractor.mockResolvedValue(0)
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Alice'))
    await userEvent.click(screen.getByRole('button', { name: /delete alice/i }))
    await waitFor(() => expect(screen.getByText(/delete alice\?/i)).toBeInTheDocument())
  })

  it('shows block message when contractor has tasks', async () => {
    mockCountByContractor.mockResolvedValue(2)
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Alice'))
    await userEvent.click(screen.getByRole('button', { name: /delete alice/i }))
    await waitFor(() => expect(screen.getByText(/2 tasks are assigned/i)).toBeInTheDocument())
    expect(mockDeleteContractor).not.toHaveBeenCalled()
  })

  it('deletes contractor on confirm and removes from list', async () => {
    mockCountByContractor.mockResolvedValue(0)
    mockDeleteContractor.mockResolvedValue(undefined)
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Alice'))
    await userEvent.click(screen.getByRole('button', { name: /delete alice/i }))
    await waitFor(() => screen.getByText(/delete alice\?/i))
    await userEvent.click(screen.getByRole('button', { name: /^delete$/i }))
    await waitFor(() => expect(screen.queryByText('Alice')).not.toBeInTheDocument())
    expect(mockDeleteContractor).toHaveBeenCalledWith('c1')
  })

  it('dismisses block message when Dismiss is clicked', async () => {
    mockCountByContractor.mockResolvedValue(1)
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Alice'))
    await userEvent.click(screen.getByRole('button', { name: /delete alice/i }))
    await waitFor(() => screen.getByText(/1 task is assigned/i))
    await userEvent.click(screen.getByRole('button', { name: /dismiss/i }))
    expect(screen.queryByText(/task is assigned/i)).not.toBeInTheDocument()
  })
})

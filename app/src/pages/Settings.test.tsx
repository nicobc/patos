import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Settings } from './Settings'

vi.mock('../services/contractorsService', () => ({
  listContractors:        vi.fn(),
  createContractor:       vi.fn(),
  updateContractor:       vi.fn(),
  deleteContractor:       vi.fn(),
  countTasksByContractor: vi.fn(),
}))

import {
  listContractors,
  createContractor,
  updateContractor,
  deleteContractor,
  countTasksByContractor,
} from '../services/contractorsService'

const mockList  = vi.mocked(listContractors)
const mockCreate = vi.mocked(createContractor)
const mockUpdate = vi.mocked(updateContractor)
const mockDelete = vi.mocked(deleteContractor)
const mockCount  = vi.mocked(countTasksByContractor)

const alice = { id: 'c1', name: 'Alice', email: 'alice@example.com', phone: null, created_at: '' }
const bob   = { id: 'c2', name: 'Bob',   email: null, phone: '555-1234',       created_at: '' }

beforeEach(() => {
  vi.clearAllMocks()
  mockList.mockResolvedValue([alice, bob])
  mockCount.mockResolvedValue(0)
})

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
    mockList.mockResolvedValue([])
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => expect(screen.getByText(/no contractors/i)).toBeInTheDocument())
  })

  it('shows error when fetch fails', async () => {
    mockList.mockRejectedValue(new Error('fail'))
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => expect(screen.getByText(/failed to load/i)).toBeInTheDocument())
  })

  it('calls onBack when ← Board is clicked', async () => {
    const onBack = vi.fn()
    render(<Settings onBack={onBack} />)
    await userEvent.click(screen.getByRole('button', { name: /board/i }))
    expect(onBack).toHaveBeenCalled()
  })
})

describe('Settings — add contractor', () => {
  it('shows the contractor form when Add is clicked', async () => {
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Alice'))
    await userEvent.click(screen.getByRole('button', { name: /\+ add/i }))
    expect(screen.getByRole('heading', { name: /new contractor/i })).toBeInTheDocument()
  })

  it('creates a contractor and returns to list', async () => {
    const newContractor = { ...alice, id: 'c3', name: 'Carol', email: null, phone: null }
    mockCreate.mockResolvedValue(newContractor)
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Alice'))

    await userEvent.click(screen.getByRole('button', { name: /\+ add/i }))
    await userEvent.type(screen.getByRole('textbox', { name: /name/i }), 'Carol')
    await userEvent.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => expect(screen.getByText('Carol')).toBeInTheDocument())
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ name: 'Carol' }))
  })

  it('blocks form submission when name is empty', async () => {
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Alice'))
    await userEvent.click(screen.getByRole('button', { name: /\+ add/i }))
    await userEvent.click(screen.getByRole('button', { name: /create/i }))
    expect(screen.getByText(/required/i)).toBeInTheDocument()
    expect(mockCreate).not.toHaveBeenCalled()
  })
})

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
    mockUpdate.mockResolvedValue(updated)
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Alice'))

    await userEvent.click(screen.getByRole('button', { name: /edit alice/i }))
    const nameInput = screen.getByDisplayValue('Alice')
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'Alice B.')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => expect(screen.getByText('Alice B.')).toBeInTheDocument())
    expect(mockUpdate).toHaveBeenCalledWith('c1', expect.objectContaining({ name: 'Alice B.' }))
  })
})

describe('Settings — delete contractor', () => {
  it('shows confirmation when contractor has no tasks', async () => {
    mockCount.mockResolvedValue(0)
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Alice'))
    await userEvent.click(screen.getByRole('button', { name: /delete alice/i }))
    await waitFor(() => expect(screen.getByText(/delete alice\?/i)).toBeInTheDocument())
  })

  it('shows block message when contractor has tasks', async () => {
    mockCount.mockResolvedValue(2)
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Alice'))
    await userEvent.click(screen.getByRole('button', { name: /delete alice/i }))
    await waitFor(() => expect(screen.getByText(/2 tasks are assigned/i)).toBeInTheDocument())
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('deletes contractor on confirm and removes from list', async () => {
    mockCount.mockResolvedValue(0)
    mockDelete.mockResolvedValue(undefined)
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Alice'))
    await userEvent.click(screen.getByRole('button', { name: /delete alice/i }))
    await waitFor(() => screen.getByText(/delete alice\?/i))
    await userEvent.click(screen.getByRole('button', { name: /^delete$/i }))
    await waitFor(() => expect(screen.queryByText('Alice')).not.toBeInTheDocument())
    expect(mockDelete).toHaveBeenCalledWith('c1')
  })

  it('dismisses block message when Dismiss is clicked', async () => {
    mockCount.mockResolvedValue(1)
    render(<Settings onBack={vi.fn()} />)
    await waitFor(() => screen.getByText('Alice'))
    await userEvent.click(screen.getByRole('button', { name: /delete alice/i }))
    await waitFor(() => screen.getByText(/1 task is assigned/i))
    await userEvent.click(screen.getByRole('button', { name: /dismiss/i }))
    expect(screen.queryByText(/task is assigned/i)).not.toBeInTheDocument()
  })
})

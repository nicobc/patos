import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TaskDetail } from './TaskDetail'

vi.mock('../services/tasksService', () => ({
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}))

import { updateTask, deleteTask } from '../services/tasksService'
const mockUpdateTask = vi.mocked(updateTask)
const mockDeleteTask = vi.mocked(deleteTask)

const task = {
  id: 't1',
  title: 'Paint walls',
  description: 'All interior walls',
  project_id: 'p1',
  owner_id: null,
  contractor_id: 'c1',
  expected_cost: 1500,
  actual_cost: null,
  expected_duration_days: 3,
  actual_start: '2026-03-01',
  actual_end: null,
  status: 'ready',
  created_at: '2026-01-01T00:00:00Z',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('TaskDetail — display', () => {
  it('renders task title', () => {
    render(<TaskDetail task={task} contractorName="Alice" onBack={vi.fn()} />)
    expect(screen.getByRole('heading', { name: 'Paint walls' })).toBeInTheDocument()
  })

  it('renders status, description, and contractor', () => {
    render(<TaskDetail task={task} contractorName="Alice" onBack={vi.fn()} />)
    expect(screen.getByText('Ready')).toBeInTheDocument()
    expect(screen.getByText('All interior walls')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('renders numeric fields', () => {
    render(<TaskDetail task={task} contractorName={null} onBack={vi.fn()} />)
    expect(screen.getByText('3 days')).toBeInTheDocument()
    expect(screen.getByText(/^\$1.500$/)).toBeInTheDocument()
  })

  it('shows — for null cost and dates', () => {
    render(<TaskDetail task={{ ...task, actual_cost: null, actual_end: null }} contractorName={null} onBack={vi.fn()} />)
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThan(0)
  })

  it('shows Unassigned when contractor is null', () => {
    render(<TaskDetail task={{ ...task, contractor_id: null }} contractorName={null} onBack={vi.fn()} />)
    expect(screen.getByText('Unassigned')).toBeInTheDocument()
  })

  it('omits description row when null', () => {
    render(<TaskDetail task={{ ...task, description: null }} contractorName={null} onBack={vi.fn()} />)
    expect(screen.queryByText('All interior walls')).not.toBeInTheDocument()
  })

  it('renders an Edit button', () => {
    render(<TaskDetail task={task} contractorName={null} onBack={vi.fn()} />)
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
  })
})

describe('TaskDetail — navigation', () => {
  it('Back button calls onBack', async () => {
    const onBack = vi.fn()
    render(<TaskDetail task={task} contractorName={null} onBack={onBack} />)
    await userEvent.click(screen.getByRole('button', { name: /board/i }))
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('Edit button calls onEdit', async () => {
    const onEdit = vi.fn()
    render(<TaskDetail task={task} contractorName={null} onBack={vi.fn()} onEdit={onEdit} />)
    await userEvent.click(screen.getByRole('button', { name: /edit/i }))
    expect(onEdit).toHaveBeenCalledTimes(1)
  })
})

describe('TaskDetail — discard', () => {
  it('shows confirmation prompt when Discard is clicked', async () => {
    render(<TaskDetail task={task} contractorName={null} onBack={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /discard/i }))
    expect(screen.getByText('Discard this task?')).toBeInTheDocument()
  })

  it('Cancel clears the confirmation', async () => {
    render(<TaskDetail task={task} contractorName={null} onBack={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /discard/i }))
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByText('Discard this task?')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
  })

  it('Confirm calls updateTask with discarded status and triggers onBack', async () => {
    mockUpdateTask.mockResolvedValue({ ...task, status: 'discarded' })
    const onBack = vi.fn()
    render(<TaskDetail task={task} contractorName={null} onBack={onBack} />)
    await userEvent.click(screen.getByRole('button', { name: /discard/i }))
    await userEvent.click(screen.getByRole('button', { name: /confirm/i }))
    await waitFor(() => expect(mockUpdateTask).toHaveBeenCalledWith('t1', { status: 'discarded' }))
    expect(onBack).toHaveBeenCalled()
  })

  it('shows error when discard fails', async () => {
    mockUpdateTask.mockRejectedValue(new Error('fail'))
    render(<TaskDetail task={task} contractorName={null} onBack={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /discard/i }))
    await userEvent.click(screen.getByRole('button', { name: /confirm/i }))
    await waitFor(() => expect(screen.getByText('Failed to discard task')).toBeInTheDocument())
  })
})

describe('TaskDetail — delete', () => {
  it('shows confirmation prompt when Delete is clicked', async () => {
    render(<TaskDetail task={task} contractorName={null} onBack={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(screen.getByText('Delete this task permanently?')).toBeInTheDocument()
  })

  it('Confirm calls deleteTask and triggers onBack', async () => {
    mockDeleteTask.mockResolvedValue(undefined)
    const onBack = vi.fn()
    render(<TaskDetail task={task} contractorName={null} onBack={onBack} />)
    await userEvent.click(screen.getByRole('button', { name: /delete/i }))
    await userEvent.click(screen.getByRole('button', { name: /confirm/i }))
    await waitFor(() => expect(mockDeleteTask).toHaveBeenCalledWith('t1'))
    expect(onBack).toHaveBeenCalled()
  })

  it('shows error when delete fails', async () => {
    mockDeleteTask.mockRejectedValue(new Error('fail'))
    render(<TaskDetail task={task} contractorName={null} onBack={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /delete/i }))
    await userEvent.click(screen.getByRole('button', { name: /confirm/i }))
    await waitFor(() => expect(screen.getByText('Failed to delete task')).toBeInTheDocument())
  })
})

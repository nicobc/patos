import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TaskForm } from './TaskForm'

vi.mock('../services/tasksService', () => ({
  createTask: vi.fn(),
  updateTask: vi.fn(),
  listBlockers: vi.fn().mockResolvedValue([]),
  setBlockers: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../context/useAuth', () => ({
  useAuth: () => ({ session: { user: { id: 'u1' } } }),
}))

import { createTask, updateTask, setBlockers } from '../services/tasksService'
const mockCreateTask = vi.mocked(createTask)
const mockUpdateTask = vi.mocked(updateTask)
const mockSetBlockers = vi.mocked(setBlockers)

const contractors = [
  { id: 'c1', name: 'Alice', email: 'alice@example.com', phone: '555-0001', created_at: '2026-01-01T00:00:00Z' },
  { id: 'c2', name: 'Bob',   email: 'bob@example.com',   phone: '555-0002', created_at: '2026-01-01T00:00:00Z' },
]

const task = {
  id: 't1',
  title: 'Paint walls',
  description: 'All interior walls',
  project_id: 'p1',
  owner_id: 'u1',
  contractor_id: 'c1',
  expected_cost: 1500,
  actual_cost: null,
  expected_duration_days: 3,
  actual_start: '2026-03-01',
  actual_end: null,
  status: 'planned',
  created_at: '2026-01-01T00:00:00Z',
}

const saved = { ...task, title: 'Updated' }

beforeEach(() => { vi.clearAllMocks() })

describe('TaskForm — create', () => {
  it('renders New task heading', () => {
    render(<TaskForm projectId="p1" contractors={contractors} onBack={vi.fn()} onSaved={vi.fn()} />)
    expect(screen.getByRole('heading', { name: /new task/i })).toBeInTheDocument()
  })

  it('does not render status field in create mode', () => {
    render(<TaskForm projectId="p1" contractors={contractors} onBack={vi.fn()} onSaved={vi.fn()} />)
    expect(screen.queryByLabelText(/status/i)).not.toBeInTheDocument()
  })

  it('shows title required error when submitted empty', async () => {
    render(<TaskForm projectId="p1" contractors={contractors} onBack={vi.fn()} onSaved={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /create/i }))
    expect(screen.getByText('Required')).toBeInTheDocument()
    expect(mockCreateTask).not.toHaveBeenCalled()
  })

  it('calls createTask with correct data and invokes onSaved', async () => {
    mockCreateTask.mockResolvedValue(saved)
    const onSaved = vi.fn()
    render(<TaskForm projectId="p1" contractors={contractors} onBack={vi.fn()} onSaved={onSaved} />)

    await userEvent.type(screen.getByRole('textbox', { name: /title/i }), 'New task title')
    await userEvent.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => expect(mockCreateTask).toHaveBeenCalledWith(expect.objectContaining({
      title: 'New task title',
      project_id: 'p1',
      owner_id: 'u1',
      status: 'ideation',
    })))
    expect(onSaved).toHaveBeenCalledWith(saved)
  })

  it('shows error when createTask fails', async () => {
    mockCreateTask.mockRejectedValue(new Error('fail'))
    render(<TaskForm projectId="p1" contractors={contractors} onBack={vi.fn()} onSaved={vi.fn()} />)
    await userEvent.type(screen.getByRole('textbox', { name: /title/i }), 'Title')
    await userEvent.click(screen.getByRole('button', { name: /create/i }))
    await waitFor(() => expect(screen.getByText('Failed to create task')).toBeInTheDocument())
  })

  it('populates contractor options', () => {
    render(<TaskForm projectId="p1" contractors={contractors} onBack={vi.fn()} onSaved={vi.fn()} />)
    expect(screen.getByRole('option', { name: 'Alice' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Bob' })).toBeInTheDocument()
  })

  it('back arrow (← Board) with no changes calls onBack directly', async () => {
    const onBack = vi.fn()
    render(<TaskForm projectId="p1" contractors={contractors} onBack={onBack} onSaved={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /← board/i }))
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('Cancel with no changes calls onBack directly', async () => {
    const onBack = vi.fn()
    render(<TaskForm projectId="p1" contractors={contractors} onBack={onBack} onSaved={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /^cancel$/i }))
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('Cancel with changes shows confirmation prompt', async () => {
    render(<TaskForm projectId="p1" contractors={contractors} onBack={vi.fn()} onSaved={vi.fn()} />)
    await userEvent.type(screen.getByRole('textbox', { name: /title/i }), 'X')
    await userEvent.click(screen.getByRole('button', { name: /^cancel$/i }))
    expect(screen.getByText('Discard unsaved changes?')).toBeInTheDocument()
  })

  it('Keep editing dismisses the confirmation', async () => {
    render(<TaskForm projectId="p1" contractors={contractors} onBack={vi.fn()} onSaved={vi.fn()} />)
    await userEvent.type(screen.getByRole('textbox', { name: /title/i }), 'X')
    await userEvent.click(screen.getByRole('button', { name: /^cancel$/i }))
    await userEvent.click(screen.getByRole('button', { name: /keep editing/i }))
    expect(screen.queryByText('Discard unsaved changes?')).not.toBeInTheDocument()
  })

  it('Discard calls onBack', async () => {
    const onBack = vi.fn()
    render(<TaskForm projectId="p1" contractors={contractors} onBack={onBack} onSaved={vi.fn()} />)
    await userEvent.type(screen.getByRole('textbox', { name: /title/i }), 'X')
    await userEvent.click(screen.getByRole('button', { name: /^cancel$/i }))
    await userEvent.click(screen.getByRole('button', { name: /^discard$/i }))
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('edit mode back arrow reads ← Task', () => {
    render(<TaskForm task={task} projectId="p1" contractors={contractors} onBack={vi.fn()} onSaved={vi.fn()} />)
    expect(screen.getByRole('button', { name: /← task/i })).toBeInTheDocument()
  })
})

describe('TaskForm — edit', () => {
  it('renders Edit task heading and pre-fills fields', () => {
    render(<TaskForm task={task} projectId="p1" contractors={contractors} onBack={vi.fn()} onSaved={vi.fn()} />)
    expect(screen.getByRole('heading', { name: /edit task/i })).toBeInTheDocument()
    expect(screen.getByDisplayValue('Paint walls')).toBeInTheDocument()
    expect(screen.getByDisplayValue('All interior walls')).toBeInTheDocument()
  })

  it('renders status select in edit mode', () => {
    render(<TaskForm task={task} projectId="p1" contractors={contractors} onBack={vi.fn()} onSaved={vi.fn()} />)
    expect(screen.getByDisplayValue('Planned')).toBeInTheDocument()
  })

  it('calls updateTask with updated title and invokes onSaved', async () => {
    mockUpdateTask.mockResolvedValue(saved)
    const onSaved = vi.fn()
    render(<TaskForm task={task} projectId="p1" contractors={contractors} onBack={vi.fn()} onSaved={onSaved} />)

    await userEvent.clear(screen.getByRole('textbox', { name: /title/i }))
    await userEvent.type(screen.getByRole('textbox', { name: /title/i }), 'Updated')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => expect(mockUpdateTask).toHaveBeenCalledWith('t1', expect.objectContaining({ title: 'Updated' })))
    expect(onSaved).toHaveBeenCalledWith(saved)
  })

  it('shows error when updateTask fails', async () => {
    mockUpdateTask.mockRejectedValue(new Error('fail'))
    render(<TaskForm task={task} projectId="p1" contractors={contractors} onBack={vi.fn()} onSaved={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => expect(screen.getByText('Failed to save task')).toBeInTheDocument())
  })

  it('blocks submission when status is in_progress and actual_start is empty', async () => {
    const inProgressTask = { ...task, status: 'in_progress', actual_start: null }
    render(<TaskForm task={inProgressTask} projectId="p1" contractors={contractors} onBack={vi.fn()} onSaved={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => expect(screen.getByText('Start date is required')).toBeInTheDocument())
    expect(mockUpdateTask).not.toHaveBeenCalled()
  })

  it('blocks submission when status is done and actual_end is empty', async () => {
    const doneTask = { ...task, status: 'done', actual_start: '2026-03-01', actual_end: null }
    render(<TaskForm task={doneTask} projectId="p1" contractors={contractors} onBack={vi.fn()} onSaved={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => expect(screen.getByText('End date is required')).toBeInTheDocument())
    expect(mockUpdateTask).not.toHaveBeenCalled()
  })
})

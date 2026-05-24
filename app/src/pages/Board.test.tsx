import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Board } from './Board'
import type { TaskChangeEvent } from '../services/tasksService'

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn(), channel: vi.fn(), removeChannel: vi.fn() },
}))
vi.mock('../services/projectsService', () => ({ listProjects: vi.fn() }))
vi.mock('../services/contractorsService', () => ({ listContractors: vi.fn() }))
vi.mock('../services/tasksService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/tasksService')>()
  return {
    ...actual,
    listTasksByProject: vi.fn(),
    subscribeToTaskChanges: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
  }
})

import { listProjects } from '../services/projectsService'
import { listContractors } from '../services/contractorsService'
import { listTasksByProject, subscribeToTaskChanges, updateTask } from '../services/tasksService'

const mockListProjects           = vi.mocked(listProjects)
const mockListContractors        = vi.mocked(listContractors)
const mockListTasksByProject     = vi.mocked(listTasksByProject)
const mockSubscribeToTaskChanges = vi.mocked(subscribeToTaskChanges)
const mockUpdateTask             = vi.mocked(updateTask)

const projects = [
  { id: 'p1', name: 'Short-term reno', description: null, created_at: '' },
  { id: 'p2', name: 'Long-term reno',  description: null, created_at: '' },
]

const contractors = [
  { id: 'c1', name: 'Alice', email: null, phone: null, created_at: '' },
]

const makeTask = (overrides = {}) => ({
  id: 't1', title: 'Paint walls', description: null,
  project_id: 'p1', owner_id: null, contractor_id: null,
  expected_cost: null, actual_cost: null, expected_duration_days: null,
  actual_start: null, actual_end: null, status: 'ideation',
  created_at: '2026-01-01T00:00:00Z',
  ...overrides,
})

beforeEach(() => {
  vi.clearAllMocks()
  mockListProjects.mockResolvedValue(projects)
  mockListContractors.mockResolvedValue(contractors)
  mockListTasksByProject.mockResolvedValue([])
  mockSubscribeToTaskChanges.mockReturnValue(vi.fn())
  mockUpdateTask.mockResolvedValue(makeTask())
})

describe('Board — project selector', () => {
  it('shows loading state initially', () => {
    mockListProjects.mockImplementation(() => new Promise(() => {}))
    render(<Board />)
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('renders selector and 5 columns after load', async () => {
    render(<Board />)
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: /select project/i })).toBeInTheDocument()
    )
    for (const label of ['Ideation', 'Planned', 'Ready', 'In Progress', 'Done']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('auto-selects the first project', async () => {
    render(<Board />)
    await waitFor(() => {
      expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('p1')
    })
  })

  it('updates selected project on change', async () => {
    render(<Board />)
    const select = await screen.findByRole('combobox')
    await userEvent.selectOptions(select, 'p2')
    expect((select as HTMLSelectElement).value).toBe('p2')
  })

  it('shows error state when projects fetch fails', async () => {
    mockListProjects.mockRejectedValue(new Error('network error'))
    render(<Board />)
    await waitFor(() =>
      expect(screen.getByText('Failed to load projects')).toBeInTheDocument()
    )
  })
})

describe('Board — task cards', () => {
  it('renders cards in the correct column', async () => {
    mockListTasksByProject.mockResolvedValue([makeTask()])
    render(<Board />)
    await waitFor(() => expect(screen.getByText('Paint walls')).toBeInTheDocument())
    expect(screen.getAllByText('No tasks')).toHaveLength(4)
  })

  it('shows contractor name when present', async () => {
    mockListTasksByProject.mockResolvedValue([makeTask({ contractor_id: 'c1' })])
    render(<Board />)
    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument())
  })

  it('excludes discarded tasks', async () => {
    mockListTasksByProject.mockResolvedValue([
      makeTask({ status: 'discarded', title: 'Hidden task' }),
    ])
    render(<Board />)
    await waitFor(() => expect(screen.getAllByText('No tasks')).toHaveLength(5))
    expect(screen.queryByText('Hidden task')).not.toBeInTheDocument()
  })

  it('renders on_hold task in the in_progress column', async () => {
    mockListTasksByProject.mockResolvedValue([makeTask({ status: 'on_hold' })])
    render(<Board />)
    await waitFor(() => expect(screen.getByText('Paint walls')).toBeInTheDocument())
    expect(screen.getAllByText('No tasks')).toHaveLength(4)
    expect(screen.getByRole('button', { name: /resume task/i })).toBeInTheDocument()
  })

  it('shows tasks error when fetch fails', async () => {
    mockListTasksByProject.mockRejectedValue(new Error('fail'))
    render(<Board />)
    await waitFor(() =>
      expect(screen.getByText('Failed to load tasks')).toBeInTheDocument()
    )
  })

  it('shows task detail view when a card is clicked', async () => {
    mockListTasksByProject.mockResolvedValue([makeTask()])
    render(<Board />)
    const card = await screen.findByRole('button', { name: /paint walls/i })
    await userEvent.click(card)
    expect(screen.getByRole('heading', { name: 'Paint walls' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /board/i })).toBeInTheDocument()
  })

  it('returns to board when Back is clicked from detail view', async () => {
    mockListTasksByProject.mockResolvedValue([makeTask()])
    render(<Board />)
    await userEvent.click(await screen.findByRole('button', { name: /paint walls/i }))
    await userEvent.click(screen.getByRole('button', { name: /board/i }))
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('subscribes to task changes for the selected project', async () => {
    render(<Board />)
    await waitFor(() =>
      expect(mockSubscribeToTaskChanges).toHaveBeenCalledWith('p1', expect.any(Function))
    )
  })

  it('adds an inserted task to the board', async () => {
    let changeCallback: ((e: TaskChangeEvent) => void) | null = null
    mockSubscribeToTaskChanges.mockImplementation((_id, cb) => {
      changeCallback = cb
      return vi.fn()
    })

    render(<Board />)
    await waitFor(() => expect(changeCallback).not.toBeNull())

    act(() => changeCallback!({ eventType: 'INSERT', record: makeTask({ title: 'New task' }) }))
    expect(screen.getByText('New task')).toBeInTheDocument()
  })

  it('removes a deleted task from the board', async () => {
    const task = makeTask()
    mockListTasksByProject.mockResolvedValue([task])
    let changeCallback: ((e: TaskChangeEvent) => void) | null = null
    mockSubscribeToTaskChanges.mockImplementation((_id, cb) => {
      changeCallback = cb
      return vi.fn()
    })

    render(<Board />)
    await waitFor(() => expect(screen.getByText('Paint walls')).toBeInTheDocument())

    act(() => changeCallback!({ eventType: 'DELETE', id: 't1' }))
    expect(screen.queryByText('Paint walls')).not.toBeInTheDocument()
  })
})

describe('Board — status transitions', () => {
  it('optimistically moves a card to the next column', async () => {
    mockListTasksByProject.mockResolvedValue([makeTask({ status: 'ideation' })])
    mockUpdateTask.mockResolvedValue(makeTask({ status: 'planned' }))
    render(<Board />)

    await waitFor(() => expect(screen.getByText('Paint walls')).toBeInTheDocument())
    await userEvent.click(screen.getByRole('button', { name: /next status/i }))

    await waitFor(() =>
      expect(mockUpdateTask).toHaveBeenCalledWith('t1', expect.objectContaining({ status: 'planned' }))
    )
  })

  it('sets actual_start when transitioning to in_progress', async () => {
    vi.setSystemTime(new Date('2026-05-24'))
    mockListTasksByProject.mockResolvedValue([makeTask({ status: 'ready', actual_start: null })])
    mockUpdateTask.mockResolvedValue(makeTask({ status: 'in_progress', actual_start: '2026-05-24' }))
    render(<Board />)

    await waitFor(() => expect(screen.getByText('Paint walls')).toBeInTheDocument())
    await userEvent.click(screen.getByRole('button', { name: /next status/i }))

    await waitFor(() =>
      expect(mockUpdateTask).toHaveBeenCalledWith('t1', { status: 'in_progress', actual_start: '2026-05-24' })
    )
    vi.useRealTimers()
  })

  it('sets actual_end when transitioning to done', async () => {
    vi.setSystemTime(new Date('2026-05-24'))
    mockListTasksByProject.mockResolvedValue([makeTask({ status: 'in_progress', actual_end: null })])
    mockUpdateTask.mockResolvedValue(makeTask({ status: 'done', actual_end: '2026-05-24' }))
    render(<Board />)

    await waitFor(() => expect(screen.getByText('Paint walls')).toBeInTheDocument())
    await userEvent.click(screen.getByRole('button', { name: /next status/i }))

    await waitFor(() =>
      expect(mockUpdateTask).toHaveBeenCalledWith('t1', { status: 'done', actual_end: '2026-05-24' })
    )
    vi.useRealTimers()
  })

  it('prev button is disabled in ideation column', async () => {
    mockListTasksByProject.mockResolvedValue([makeTask({ status: 'ideation' })])
    render(<Board />)

    await waitFor(() => expect(screen.getByText('Paint walls')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /previous status/i })).toBeDisabled()
  })

  it('next button is disabled in done column', async () => {
    mockListTasksByProject.mockResolvedValue([makeTask({ status: 'done' })])
    render(<Board />)

    await waitFor(() => expect(screen.getByText('Paint walls')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /next status/i })).toBeDisabled()
  })

  it('re-fetches from server and shows error on transition failure', async () => {
    mockListTasksByProject.mockResolvedValue([makeTask({ status: 'ideation' })])
    mockUpdateTask.mockRejectedValue(new Error('network error'))
    render(<Board />)

    await waitFor(() => expect(screen.getByText('Paint walls')).toBeInTheDocument())
    await userEvent.click(screen.getByRole('button', { name: /next status/i }))

    await waitFor(() =>
      expect(screen.getByText(/failed to move task/i)).toBeInTheDocument()
    )
    expect(mockListTasksByProject).toHaveBeenCalledTimes(2)
  })
})

import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Board } from './Board'
import type { TaskChangeEvent, DepChangeEvent } from '../services/tasksService'

vi.mock('../context/useToast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}))

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn(), channel: vi.fn(), removeChannel: vi.fn() },
}))
vi.mock('../services/projectsService', () => ({
  listProjects:              vi.fn(),
  subscribeToProjectChanges: vi.fn(),
}))
vi.mock('../services/contractorsService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/contractorsService')>()
  return { ...actual, listContractors: vi.fn(), subscribeToContractorChanges: vi.fn() }
})
vi.mock('../pages/Settings', () => ({ Settings: ({ onBack }: { onBack: () => void }) =>
  <div><span>Settings page</span><button onClick={onBack}>← Board</button></div>
}))
vi.mock('../services/tasksService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/tasksService')>()
  return {
    ...actual,
    listTasksByProject: vi.fn(),
    listRawDepsByTasks: vi.fn().mockResolvedValue([]),
    subscribeToTaskChanges: vi.fn(),
    subscribeToDepsChanges: vi.fn().mockReturnValue(vi.fn()),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
  }
})

import { listProjects, subscribeToProjectChanges } from '../services/projectsService'
import { listContractors, subscribeToContractorChanges } from '../services/contractorsService'
import { listTasksByProject, listRawDepsByTasks, subscribeToTaskChanges, subscribeToDepsChanges, updateTask } from '../services/tasksService'

const mockListProjects              = vi.mocked(listProjects)
const mockSubscribeToProjectChanges = vi.mocked(subscribeToProjectChanges)
const mockListContractors           = vi.mocked(listContractors)
const mockSubContractors            = vi.mocked(subscribeToContractorChanges)
const mockListTasksByProject     = vi.mocked(listTasksByProject)
const mockListRawDepsByTasks     = vi.mocked(listRawDepsByTasks)
const mockSubscribeToTaskChanges = vi.mocked(subscribeToTaskChanges)
const mockSubscribeToDepsChanges = vi.mocked(subscribeToDepsChanges)
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
  mockSubscribeToProjectChanges.mockReturnValue(vi.fn())
  mockListContractors.mockResolvedValue(contractors)
  mockSubContractors.mockReturnValue(vi.fn())
  mockListTasksByProject.mockResolvedValue([])
  mockSubscribeToTaskChanges.mockReturnValue(vi.fn())
  mockUpdateTask.mockResolvedValue(makeTask())
})

describe('Board — settings', () => {
  it('navigates to settings when gear icon is clicked', async () => {
    render(<Board />)
    await waitFor(() => screen.getByRole('button', { name: /settings/i }))
    await userEvent.click(screen.getByRole('button', { name: /settings/i }))
    expect(screen.getByText('Settings page')).toBeInTheDocument()
  })

  it('returns to board when back is clicked from settings', async () => {
    render(<Board />)
    await waitFor(() => screen.getByRole('button', { name: /settings/i }))
    await userEvent.click(screen.getByRole('button', { name: /settings/i }))
    await userEvent.click(screen.getByRole('button', { name: /← board/i }))
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })
})

describe('Board — project selector', () => {
  it('shows loading state initially', () => {
    mockListProjects.mockImplementation(() => new Promise(() => {}))
    render(<Board />)
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('renders selector and 4 columns after load', async () => {
    render(<Board />)
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: /select project/i })).toBeInTheDocument()
    )
    for (const label of ['Ideation', 'Planned', 'In Progress', 'Done']) {
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
    expect(screen.getAllByText('No tasks')).toHaveLength(3)
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
    await waitFor(() => expect(screen.getAllByText('No tasks')).toHaveLength(4))
    expect(screen.queryByText('Hidden task')).not.toBeInTheDocument()
  })

  it('renders on_hold task in the in_progress column', async () => {
    mockListTasksByProject.mockResolvedValue([makeTask({ status: 'on_hold' })])
    render(<Board />)
    await waitFor(() => expect(screen.getByText('Paint walls')).toBeInTheDocument())
    expect(screen.getAllByText('No tasks')).toHaveLength(3)
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
    mockListTasksByProject.mockResolvedValue([makeTask({ status: 'planned', actual_start: null })])
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

describe('Board — discarded column', () => {
  it('Show discarded toggle is visible on the board view', async () => {
    render(<Board />)
    await waitFor(() => screen.getByRole('button', { name: /show discarded/i }))
    expect(screen.getByRole('button', { name: /show discarded/i })).toBeInTheDocument()
  })

  it('Discarded column is hidden by default', async () => {
    mockListTasksByProject.mockResolvedValue([makeTask({ status: 'discarded', title: 'Hidden task' })])
    render(<Board />)
    await waitFor(() => expect(screen.getAllByText('No tasks')).toHaveLength(4))
    expect(screen.queryByText('Discarded')).not.toBeInTheDocument()
    expect(screen.queryByText('Hidden task')).not.toBeInTheDocument()
  })

  it('clicking toggle renders Discarded column with discarded task', async () => {
    mockListTasksByProject.mockResolvedValue([makeTask({ status: 'discarded', title: 'Old task' })])
    render(<Board />)
    await waitFor(() => screen.getByRole('button', { name: /show discarded/i }))
    await userEvent.click(screen.getByRole('button', { name: /show discarded/i }))
    expect(screen.getByText('Discarded')).toBeInTheDocument()
    expect(screen.getByText('Old task')).toBeInTheDocument()
  })

  it('clicking toggle again hides the Discarded column', async () => {
    mockListTasksByProject.mockResolvedValue([makeTask({ status: 'discarded', title: 'Old task' })])
    render(<Board />)
    await waitFor(() => screen.getByRole('button', { name: /show discarded/i }))
    await userEvent.click(screen.getByRole('button', { name: /show discarded/i }))
    await userEvent.click(screen.getByRole('button', { name: /show discarded/i }))
    expect(screen.queryByText('Discarded')).not.toBeInTheDocument()
  })

  it('clicking a discarded card opens TaskDetail', async () => {
    mockListTasksByProject.mockResolvedValue([makeTask({ status: 'discarded', title: 'Old task' })])
    render(<Board />)
    await waitFor(() => screen.getByRole('button', { name: /show discarded/i }))
    await userEvent.click(screen.getByRole('button', { name: /show discarded/i }))
    await userEvent.click(screen.getByRole('button', { name: /old task/i }))
    expect(screen.getByRole('heading', { name: 'Old task' })).toBeInTheDocument()
  })
})

describe('Board — project switch clears stale dep state', () => {
  it('clears blockerIds on project switch so stale indicators do not appear on new-project tasks', async () => {
    // t-shared exists in both projects with the same ID; t-blocker only in p1.
    // After switching to p2, blockerIds from p1 would incorrectly mark t-shared as
    // blocked (blocker not found in p2 tasks → treated as unresolved). The fix clears
    // blockerIds synchronously before the p2 fetch so isBlocked returns false.
    const sharedId  = 'shared-task'
    const blockerId = 'blocker-task'

    const p1Tasks = [
      makeTask({ id: sharedId,  project_id: 'p1' }),
      makeTask({ id: blockerId, project_id: 'p1', title: 'Blocker' }),
    ]
    const p2Tasks = [makeTask({ id: sharedId, project_id: 'p2' })]

    mockListTasksByProject
      .mockResolvedValueOnce(p1Tasks)
      .mockResolvedValueOnce(p2Tasks)
    mockListRawDepsByTasks
      .mockResolvedValueOnce([{ task_id: sharedId, depends_on_task_id: blockerId }])
      .mockImplementationOnce(() => new Promise(() => {})) // p2 deps never resolve

    render(<Board />)

    await waitFor(() => expect(screen.getByLabelText('Blocked')).toBeInTheDocument())

    await userEvent.selectOptions(screen.getByRole('combobox'), 'p2')

    await waitFor(() => expect(screen.getByText('Paint walls')).toBeInTheDocument())
    expect(screen.queryByLabelText('Blocked')).not.toBeInTheDocument()
  })
})

describe('Board — transition feedback banner', () => {
  it('shows feedback banner with Undo after a status change', async () => {
    mockListTasksByProject.mockResolvedValue([makeTask({ status: 'ideation' })])
    render(<Board />)
    await waitFor(() => expect(screen.getByText('Paint walls')).toBeInTheDocument())
    await userEvent.click(screen.getByRole('button', { name: /next status/i }))
    await waitFor(() => expect(screen.getByText('Moved to Planned.')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument()
  })

  it('shows "Update start" button when actual_start is stale on in_progress transition', async () => {
    vi.setSystemTime(new Date('2026-06-01'))
    mockListTasksByProject.mockResolvedValue([makeTask({ status: 'planned', actual_start: '2026-05-01' })])
    render(<Board />)
    await waitFor(() => expect(screen.getByText('Paint walls')).toBeInTheDocument())
    await userEvent.click(screen.getByRole('button', { name: /next status/i }))
    await waitFor(() => expect(screen.getByText('Moved to In Progress.')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /update start/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('shows "Update end" button when actual_end is stale on done transition', async () => {
    vi.setSystemTime(new Date('2026-06-01'))
    mockListTasksByProject.mockResolvedValue([makeTask({ status: 'in_progress', actual_end: '2026-05-01' })])
    render(<Board />)
    await waitFor(() => expect(screen.getByText('Paint walls')).toBeInTheDocument())
    await userEvent.click(screen.getByRole('button', { name: /next status/i }))
    await waitFor(() => expect(screen.getByText('Moved to Done.')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /update end/i })).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('does not show Update button when actual_start equals today', async () => {
    vi.setSystemTime(new Date('2026-06-01'))
    mockListTasksByProject.mockResolvedValue([makeTask({ status: 'planned', actual_start: '2026-06-01' })])
    render(<Board />)
    await waitFor(() => expect(screen.getByText('Paint walls')).toBeInTheDocument())
    await userEvent.click(screen.getByRole('button', { name: /next status/i }))
    await waitFor(() => expect(screen.getByText('Moved to In Progress.')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: /update/i })).not.toBeInTheDocument()
    vi.useRealTimers()
  })

  it('dismisses the banner when the X button is clicked', async () => {
    mockListTasksByProject.mockResolvedValue([makeTask({ status: 'ideation' })])
    render(<Board />)
    await waitFor(() => expect(screen.getByText('Paint walls')).toBeInTheDocument())
    await userEvent.click(screen.getByRole('button', { name: /next status/i }))
    await waitFor(() => expect(screen.getByText('Moved to Planned.')).toBeInTheDocument())
    await userEvent.click(screen.getByRole('button', { name: /dismiss/i }))
    expect(screen.queryByText('Moved to Planned.')).not.toBeInTheDocument()
  })
})

describe('Board — dep subscription isolation', () => {
  it('ignores dep events for task IDs not belonging to the current project', async () => {
    mockListTasksByProject.mockResolvedValue([makeTask({ id: 't1' })])

    let depsCallback: ((e: DepChangeEvent) => void) | null = null
    mockSubscribeToDepsChanges.mockImplementation((_id, cb) => {
      depsCallback = cb
      return vi.fn()
    })

    render(<Board />)
    await waitFor(() => expect(depsCallback).not.toBeNull())
    await waitFor(() => expect(screen.getByText('Paint walls')).toBeInTheDocument())

    act(() => depsCallback!({ eventType: 'INSERT', taskId: 'foreign-task', blockerTaskId: 't1' }))

    expect(screen.queryByLabelText('Blocked')).not.toBeInTheDocument()
  })
})

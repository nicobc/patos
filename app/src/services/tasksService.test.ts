import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import {
  listTasksByProject,
  createTask,
  updateTask,
  deleteTask,
  subscribeToTaskChanges,
  buildStatusTransition,
} from './tasksService'
import type { Task } from './tasksService'

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn(),
    removeChannel: vi.fn(),
  },
}))

const mockFrom = vi.mocked(supabase.from)
const mockChannel = vi.mocked(supabase.channel)
const mockRemoveChannel = vi.mocked(supabase.removeChannel)

const task: Task = {
  id: 'abc',
  title: 'Paint walls',
  description: null,
  project_id: 'proj-1',
  owner_id: null,
  contractor_id: null,
  expected_cost: null,
  actual_cost: null,
  expected_duration_days: null,
  actual_start: null,
  actual_end: null,
  status: 'ideation',
  created_at: '2026-01-01T00:00:00Z',
}

beforeEach(() => vi.clearAllMocks())

describe('buildStatusTransition', () => {
  it('returns only status for a plain transition', () => {
    expect(buildStatusTransition({ ...task, status: 'ideation' }, 'planned')).toEqual({ status: 'planned' })
  })

  it('sets actual_start when transitioning to in_progress with no start date', () => {
    vi.setSystemTime(new Date('2026-05-24'))
    const result = buildStatusTransition({ ...task, status: 'planned', actual_start: null }, 'in_progress')
    expect(result).toEqual({ status: 'in_progress', actual_start: '2026-05-24' })
    vi.useRealTimers()
  })

  it('does not overwrite actual_start when already set', () => {
    const result = buildStatusTransition({ ...task, status: 'planned', actual_start: '2026-01-15' }, 'in_progress')
    expect(result).toEqual({ status: 'in_progress' })
  })

  it('sets actual_end when transitioning to done with no end date', () => {
    vi.setSystemTime(new Date('2026-05-24'))
    const result = buildStatusTransition({ ...task, status: 'in_progress', actual_end: null }, 'done')
    expect(result).toEqual({ status: 'done', actual_end: '2026-05-24' })
    vi.useRealTimers()
  })

  it('does not overwrite actual_end when already set', () => {
    const result = buildStatusTransition({ ...task, status: 'in_progress', actual_end: '2026-03-10' }, 'done')
    expect(result).toEqual({ status: 'done' })
  })

  it('does not set actual_start when transitioning to on_hold', () => {
    const result = buildStatusTransition({ ...task, status: 'in_progress', actual_start: '2026-01-01' }, 'on_hold')
    expect(result).toEqual({ status: 'on_hold' })
  })

  it('does not set actual_start when resuming from on_hold to in_progress', () => {
    const result = buildStatusTransition({ ...task, status: 'on_hold', actual_start: '2026-01-01' }, 'in_progress')
    expect(result).toEqual({ status: 'in_progress' })
  })
})

describe('listTasksByProject', () => {
  it('returns tasks for a project', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [task], error: null }),
        }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    expect(await listTasksByProject('proj-1')).toEqual([task])
  })

  it('throws on error', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: null, error: new Error('fail') }),
        }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    await expect(listTasksByProject('proj-1')).rejects.toThrow('fail')
  })
})

describe('createTask', () => {
  it('inserts and returns the new task', async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: task, error: null }),
        }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    expect(await createTask({ title: 'Paint walls', project_id: 'proj-1' })).toEqual(task)
  })

  it('throws on error', async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: new Error('fail') }),
        }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    await expect(createTask({ title: 'x' })).rejects.toThrow('fail')
  })
})

describe('updateTask', () => {
  it('updates and returns the task', async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: task, error: null }),
          }),
        }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    expect(await updateTask('abc', { status: 'planned' })).toEqual(task)
  })

  it('throws on error', async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: new Error('fail') }),
          }),
        }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    await expect(updateTask('abc', { status: 'planned' })).rejects.toThrow('fail')
  })
})

describe('deleteTask', () => {
  it('deletes without returning data', async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    await expect(deleteTask('abc')).resolves.toBeUndefined()
  })

  it('throws on error', async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: new Error('fail') }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    await expect(deleteTask('abc')).rejects.toThrow('fail')
  })
})

describe('subscribeToTaskChanges', () => {
  it('sets up a channel with the correct filter and returns an unsubscribe fn', () => {
    let capturedCallback: ((payload: RealtimePostgresChangesPayload<Task>) => void) | null = null
    const fakeChannel: { on: Mock; subscribe: Mock } = {
      on: vi.fn().mockImplementation(
        (_event: string, _filter: unknown, cb: (p: RealtimePostgresChangesPayload<Task>) => void) => {
          capturedCallback = cb
          return fakeChannel
        }
      ),
      subscribe: vi.fn().mockImplementation(() => fakeChannel),
    }
    mockChannel.mockReturnValue(fakeChannel as unknown as ReturnType<typeof supabase.channel>)
    mockRemoveChannel.mockResolvedValue('ok')

    const listener = vi.fn()
    const unsubscribe = subscribeToTaskChanges('proj-1', listener)

    expect(mockChannel).toHaveBeenCalledWith('tasks-proj-1')
    expect(fakeChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tasks', filter: 'project_id=eq.proj-1' },
      expect.any(Function)
    )

    capturedCallback!({ eventType: 'INSERT', new: task, old: {} } as RealtimePostgresChangesPayload<Task>)
    expect(listener).toHaveBeenCalledWith({ eventType: 'INSERT', record: task })

    capturedCallback!({ eventType: 'UPDATE', new: { ...task, status: 'planned' }, old: task } as RealtimePostgresChangesPayload<Task>)
    expect(listener).toHaveBeenCalledWith({ eventType: 'UPDATE', record: { ...task, status: 'planned' } })

    capturedCallback!({ eventType: 'DELETE', new: {}, old: { id: 'abc' } } as RealtimePostgresChangesPayload<Task>)
    expect(listener).toHaveBeenCalledWith({ eventType: 'DELETE', id: 'abc' })

    unsubscribe()
    expect(mockRemoveChannel).toHaveBeenCalledWith(fakeChannel)
  })
})

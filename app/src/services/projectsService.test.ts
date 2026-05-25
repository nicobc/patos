import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Mock } from 'vitest'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
  countTasksByProject,
  subscribeToProjectChanges,
  type Project,
} from './projectsService'

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn(), channel: vi.fn(), removeChannel: vi.fn() },
}))

const mockFrom          = vi.mocked(supabase.from)
const mockChannel       = vi.mocked(supabase.channel)
const mockRemoveChannel = vi.mocked(supabase.removeChannel)

const project = { id: '1', name: 'Flat', description: 'Test', created_at: '' }

beforeEach(() => vi.clearAllMocks())

describe('listProjects', () => {
  it('returns projects ordered by name', async () => {
    const rows = [{ id: '1', name: 'Flat', description: null, created_at: '' }]
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: rows, error: null }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    expect(await listProjects()).toEqual(rows)
    expect(mockFrom).toHaveBeenCalledWith('projects')
  })

  it('throws when Supabase returns an error', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: null, error: new Error('db error') }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    await expect(listProjects()).rejects.toThrow('db error')
  })
})

describe('createProject', () => {
  it('inserts and returns the new project', async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: project, error: null }),
        }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    expect(await createProject({ name: 'Flat' })).toEqual(project)
  })

  it('throws on error', async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: new Error('fail') }),
        }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    await expect(createProject({ name: 'Flat' })).rejects.toThrow('fail')
  })
})

describe('updateProject', () => {
  it('updates and returns the project', async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: project, error: null }),
          }),
        }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    expect(await updateProject('1', { name: 'Flat' })).toEqual(project)
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

    await expect(updateProject('1', { name: 'Flat' })).rejects.toThrow('fail')
  })
})

describe('deleteProject', () => {
  it('deletes without returning data', async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    await expect(deleteProject('1')).resolves.toBeUndefined()
  })

  it('throws on error', async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: new Error('fail') }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    await expect(deleteProject('1')).rejects.toThrow('fail')
  })
})

describe('countTasksByProject', () => {
  it('returns the task count', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    expect(await countTasksByProject('1')).toBe(5)
  })

  it('returns 0 when count is null', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ count: null, error: null }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    expect(await countTasksByProject('1')).toBe(0)
  })

  it('throws on error', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ count: null, error: new Error('fail') }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    await expect(countTasksByProject('1')).rejects.toThrow('fail')
  })
})

describe('subscribeToProjectChanges', () => {
  it('sets up a channel and fires INSERT/UPDATE/DELETE events', () => {
    let capturedCallback: ((payload: RealtimePostgresChangesPayload<Project>) => void) | null = null
    const fakeChannel: { on: Mock; subscribe: Mock } = {
      on: vi.fn().mockImplementation(
        (_event: string, _filter: unknown, cb: (p: RealtimePostgresChangesPayload<Project>) => void) => {
          capturedCallback = cb
          return fakeChannel
        }
      ),
      subscribe: vi.fn().mockImplementation(() => fakeChannel),
    }
    mockChannel.mockReturnValue(fakeChannel as unknown as ReturnType<typeof supabase.channel>)
    mockRemoveChannel.mockResolvedValue('ok')

    const listener = vi.fn()
    const unsubscribe = subscribeToProjectChanges(listener)

    expect(mockChannel).toHaveBeenCalledWith('projects')
    expect(fakeChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'projects' },
      expect.any(Function)
    )

    capturedCallback!({ eventType: 'INSERT', new: project, old: {} } as RealtimePostgresChangesPayload<Project>)
    expect(listener).toHaveBeenCalledWith({ eventType: 'INSERT', record: project })

    capturedCallback!({ eventType: 'UPDATE', new: { ...project, name: 'Updated' }, old: project } as RealtimePostgresChangesPayload<Project>)
    expect(listener).toHaveBeenCalledWith({ eventType: 'UPDATE', record: { ...project, name: 'Updated' } })

    capturedCallback!({ eventType: 'DELETE', new: {}, old: { id: '1' } } as RealtimePostgresChangesPayload<Project>)
    expect(listener).toHaveBeenCalledWith({ eventType: 'DELETE', id: '1' })

    unsubscribe()
    expect(mockRemoveChannel).toHaveBeenCalledWith(fakeChannel)
  })
})

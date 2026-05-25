import { describe, it, expect, vi, beforeEach } from 'vitest'
import { supabase } from '../lib/supabase'
import {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
  countTasksByProject,
} from './projectsService'

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

const mockFrom = vi.mocked(supabase.from)

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

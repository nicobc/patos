import { describe, it, expect, vi, beforeEach } from 'vitest'
import { supabase } from '../lib/supabase'
import { listProjects } from './projectsService'

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

const mockFrom = vi.mocked(supabase.from)

beforeEach(() => vi.clearAllMocks())

describe('listProjects', () => {
  it('returns projects ordered by name', async () => {
    const rows = [{ id: '1', name: 'Flat', description: null, created_at: '' }]
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: rows, error: null }),
      }),
    } as any)

    expect(await listProjects()).toEqual(rows)
    expect(mockFrom).toHaveBeenCalledWith('projects')
  })

  it('throws when Supabase returns an error', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: null, error: new Error('db error') }),
      }),
    } as any)

    await expect(listProjects()).rejects.toThrow('db error')
  })
})

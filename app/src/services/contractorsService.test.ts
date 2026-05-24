import { describe, it, expect, vi, beforeEach } from 'vitest'
import { supabase } from '../lib/supabase'
import { listContractors } from './contractorsService'

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

const mockFrom = vi.mocked(supabase.from)

beforeEach(() => vi.clearAllMocks())

describe('listContractors', () => {
  it('returns contractors ordered by name', async () => {
    const rows = [{ id: '1', name: 'Alice', email: null, phone: null, created_at: '' }]
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: rows, error: null }),
      }),
    } as any)

    expect(await listContractors()).toEqual(rows)
    expect(mockFrom).toHaveBeenCalledWith('contractors')
  })

  it('throws when Supabase returns an error', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: null, error: new Error('db error') }),
      }),
    } as any)

    await expect(listContractors()).rejects.toThrow('db error')
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { supabase } from '../lib/supabase'
import {
  listContractors,
  createContractor,
  updateContractor,
  deleteContractor,
  countTasksByContractor,
} from './contractorsService'

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

const mockFrom = vi.mocked(supabase.from)

const contractor = { id: '1', name: 'Alice', email: null, phone: null, created_at: '' }

beforeEach(() => vi.clearAllMocks())

describe('listContractors', () => {
  it('returns contractors ordered by name', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [contractor], error: null }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    expect(await listContractors()).toEqual([contractor])
    expect(mockFrom).toHaveBeenCalledWith('contractors')
  })

  it('throws when Supabase returns an error', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: null, error: new Error('db error') }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    await expect(listContractors()).rejects.toThrow('db error')
  })
})

describe('createContractor', () => {
  it('inserts and returns the new contractor', async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: contractor, error: null }),
        }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    expect(await createContractor({ name: 'Alice' })).toEqual(contractor)
  })

  it('throws on error', async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: new Error('fail') }),
        }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    await expect(createContractor({ name: 'Alice' })).rejects.toThrow('fail')
  })
})

describe('updateContractor', () => {
  it('updates and returns the contractor', async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: contractor, error: null }),
          }),
        }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    expect(await updateContractor('1', { name: 'Alice' })).toEqual(contractor)
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

    await expect(updateContractor('1', { name: 'Alice' })).rejects.toThrow('fail')
  })
})

describe('deleteContractor', () => {
  it('deletes without returning data', async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    await expect(deleteContractor('1')).resolves.toBeUndefined()
  })

  it('throws on error', async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: new Error('fail') }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    await expect(deleteContractor('1')).rejects.toThrow('fail')
  })
})

describe('countTasksByContractor', () => {
  it('returns the task count', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ count: 3, error: null }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    expect(await countTasksByContractor('1')).toBe(3)
  })

  it('returns 0 when count is null', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ count: null, error: null }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    expect(await countTasksByContractor('1')).toBe(0)
  })

  it('throws on error', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ count: null, error: new Error('fail') }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    await expect(countTasksByContractor('1')).rejects.toThrow('fail')
  })
})

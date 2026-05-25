import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Mock } from 'vitest'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import {
  listContractors,
  createContractor,
  updateContractor,
  deleteContractor,
  countTasksByContractor,
  subscribeToContractorChanges,
  type Contractor,
} from './contractorsService'

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn(), channel: vi.fn(), removeChannel: vi.fn() },
}))

const mockFrom          = vi.mocked(supabase.from)
const mockChannel       = vi.mocked(supabase.channel)
const mockRemoveChannel = vi.mocked(supabase.removeChannel)

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

describe('subscribeToContractorChanges', () => {
  it('sets up a channel and fires INSERT/UPDATE/DELETE events', () => {
    let capturedCallback: ((payload: RealtimePostgresChangesPayload<Contractor>) => void) | null = null
    const fakeChannel: { on: Mock; subscribe: Mock } = {
      on: vi.fn().mockImplementation(
        (_event: string, _filter: unknown, cb: (p: RealtimePostgresChangesPayload<Contractor>) => void) => {
          capturedCallback = cb
          return fakeChannel
        }
      ),
      subscribe: vi.fn().mockImplementation(() => fakeChannel),
    }
    mockChannel.mockReturnValue(fakeChannel as unknown as ReturnType<typeof supabase.channel>)
    mockRemoveChannel.mockResolvedValue('ok')

    const listener = vi.fn()
    const unsubscribe = subscribeToContractorChanges(listener)

    expect(mockChannel).toHaveBeenCalledWith(expect.stringMatching(/^contractors-/))
    expect(fakeChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'contractors' },
      expect.any(Function)
    )

    capturedCallback!({ eventType: 'INSERT', new: contractor, old: {} } as RealtimePostgresChangesPayload<Contractor>)
    expect(listener).toHaveBeenCalledWith({ eventType: 'INSERT', record: contractor })

    capturedCallback!({ eventType: 'UPDATE', new: { ...contractor, name: 'Bob' }, old: contractor } as RealtimePostgresChangesPayload<Contractor>)
    expect(listener).toHaveBeenCalledWith({ eventType: 'UPDATE', record: { ...contractor, name: 'Bob' } })

    capturedCallback!({ eventType: 'DELETE', new: {}, old: { id: '1' } } as RealtimePostgresChangesPayload<Contractor>)
    expect(listener).toHaveBeenCalledWith({ eventType: 'DELETE', id: '1' })

    unsubscribe()
    expect(mockRemoveChannel).toHaveBeenCalledWith(fakeChannel)
  })
})

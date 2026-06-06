import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Mock } from 'vitest'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import {
  listProperties,
  createProperty,
  updateProperty,
  deleteProperty,
  countProjectsByProperty,
  subscribeToPropertyChanges,
  type Property,
} from './propertiesService'

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn(), channel: vi.fn(), removeChannel: vi.fn() },
}))

const mockFrom          = vi.mocked(supabase.from)
const mockChannel       = vi.mocked(supabase.channel)
const mockRemoveChannel = vi.mocked(supabase.removeChannel)

const prop: Property = { id: 'pr1', name: 'Flat 4B', created_at: '', updated_at: '' }

beforeEach(() => vi.clearAllMocks())

describe('listProperties', () => {
  it('returns properties ordered by name', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [prop], error: null }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    expect(await listProperties()).toEqual([prop])
    expect(mockFrom).toHaveBeenCalledWith('properties')
  })

  it('throws on error', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: null, error: new Error('fail') }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    await expect(listProperties()).rejects.toThrow('fail')
  })
})

describe('createProperty', () => {
  it('inserts and returns the new property', async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: prop, error: null }),
        }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    expect(await createProperty({ name: 'Flat 4B' })).toEqual(prop)
  })

  it('throws on error', async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: new Error('fail') }),
        }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    await expect(createProperty({ name: 'Flat 4B' })).rejects.toThrow('fail')
  })
})

describe('updateProperty', () => {
  it('updates and returns the property', async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: prop, error: null }),
          }),
        }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    expect(await updateProperty('pr1', { name: 'Flat 4B' })).toEqual(prop)
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

    await expect(updateProperty('pr1', { name: 'Flat 4B' })).rejects.toThrow('fail')
  })
})

describe('deleteProperty', () => {
  it('deletes without returning data', async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    await expect(deleteProperty('pr1')).resolves.toBeUndefined()
  })

  it('throws on error', async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: new Error('fail') }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    await expect(deleteProperty('pr1')).rejects.toThrow('fail')
  })
})

describe('countProjectsByProperty', () => {
  it('returns the project count', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ count: 3, error: null }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    expect(await countProjectsByProperty('pr1')).toBe(3)
  })

  it('returns 0 when count is null', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ count: null, error: null }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    expect(await countProjectsByProperty('pr1')).toBe(0)
  })

  it('throws on error', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ count: null, error: new Error('fail') }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    await expect(countProjectsByProperty('pr1')).rejects.toThrow('fail')
  })
})

describe('subscribeToPropertyChanges', () => {
  it('sets up a channel and fires INSERT/UPDATE/DELETE events', () => {
    let capturedCallback: ((payload: RealtimePostgresChangesPayload<Property>) => void) | null = null
    const fakeChannel: { on: Mock; subscribe: Mock } = {
      on: vi.fn().mockImplementation(
        (_event: string, _filter: unknown, cb: (p: RealtimePostgresChangesPayload<Property>) => void) => {
          capturedCallback = cb
          return fakeChannel
        }
      ),
      subscribe: vi.fn().mockImplementation(() => fakeChannel),
    }
    mockChannel.mockReturnValue(fakeChannel as unknown as ReturnType<typeof supabase.channel>)
    mockRemoveChannel.mockResolvedValue('ok')

    const listener = vi.fn()
    const unsubscribe = subscribeToPropertyChanges(listener)

    expect(mockChannel).toHaveBeenCalledWith(expect.stringMatching(/^properties-/))
    expect(fakeChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'properties' },
      expect.any(Function)
    )

    capturedCallback!({ eventType: 'INSERT', new: prop, old: {} } as RealtimePostgresChangesPayload<Property>)
    expect(listener).toHaveBeenCalledWith({ eventType: 'INSERT', record: prop })

    capturedCallback!({ eventType: 'UPDATE', new: { ...prop, name: 'Flat 5C' }, old: prop } as RealtimePostgresChangesPayload<Property>)
    expect(listener).toHaveBeenCalledWith({ eventType: 'UPDATE', record: { ...prop, name: 'Flat 5C' } })

    capturedCallback!({ eventType: 'DELETE', new: {}, old: { id: 'pr1' } } as RealtimePostgresChangesPayload<Property>)
    expect(listener).toHaveBeenCalledWith({ eventType: 'DELETE', id: 'pr1' })

    unsubscribe()
    expect(mockRemoveChannel).toHaveBeenCalledWith(fakeChannel)
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Mock } from 'vitest'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import {
  listRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  subscribeToRoomChanges,
  type Room,
} from './roomsService'

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn(), channel: vi.fn(), removeChannel: vi.fn() },
}))

const mockFrom          = vi.mocked(supabase.from)
const mockChannel       = vi.mocked(supabase.channel)
const mockRemoveChannel = vi.mocked(supabase.removeChannel)

const room: Room = { id: '1', name: 'Kitchen', color: '#e74c3c', created_at: '', updated_at: '' }

beforeEach(() => vi.clearAllMocks())

describe('listRooms', () => {
  it('returns rooms ordered by name', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [room], error: null }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    expect(await listRooms()).toEqual([room])
    expect(mockFrom).toHaveBeenCalledWith('rooms')
  })

  it('throws when Supabase returns an error', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: null, error: new Error('db error') }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    await expect(listRooms()).rejects.toThrow('db error')
  })
})

describe('createRoom', () => {
  it('inserts and returns the new room', async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: room, error: null }),
        }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    expect(await createRoom({ name: 'Kitchen', color: '#e74c3c' })).toEqual(room)
  })

  it('throws on error', async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: new Error('fail') }),
        }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    await expect(createRoom({ name: 'Kitchen', color: '#e74c3c' })).rejects.toThrow('fail')
  })
})

describe('updateRoom', () => {
  it('updates and returns the room', async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: room, error: null }),
          }),
        }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    expect(await updateRoom('1', { name: 'Kitchen' })).toEqual(room)
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

    await expect(updateRoom('1', { name: 'Kitchen' })).rejects.toThrow('fail')
  })
})

describe('deleteRoom', () => {
  it('deletes without returning data', async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    await expect(deleteRoom('1')).resolves.toBeUndefined()
  })

  it('throws on error', async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: new Error('fail') }),
      }),
    } as unknown as ReturnType<typeof supabase.from>)

    await expect(deleteRoom('1')).rejects.toThrow('fail')
  })
})

describe('subscribeToRoomChanges', () => {
  it('sets up a channel and fires INSERT/UPDATE/DELETE events', () => {
    let capturedCallback: ((payload: RealtimePostgresChangesPayload<Room>) => void) | null = null
    const fakeChannel: { on: Mock; subscribe: Mock } = {
      on: vi.fn().mockImplementation(
        (_event: string, _filter: unknown, cb: (p: RealtimePostgresChangesPayload<Room>) => void) => {
          capturedCallback = cb
          return fakeChannel
        }
      ),
      subscribe: vi.fn().mockImplementation(() => fakeChannel),
    }
    mockChannel.mockReturnValue(fakeChannel as unknown as ReturnType<typeof supabase.channel>)
    mockRemoveChannel.mockResolvedValue('ok')

    const listener = vi.fn()
    const unsubscribe = subscribeToRoomChanges(listener)

    expect(mockChannel).toHaveBeenCalledWith(expect.stringMatching(/^rooms-/))
    expect(fakeChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'rooms' },
      expect.any(Function)
    )

    capturedCallback!({ eventType: 'INSERT', new: room, old: {} } as RealtimePostgresChangesPayload<Room>)
    expect(listener).toHaveBeenCalledWith({ eventType: 'INSERT', record: room })

    capturedCallback!({ eventType: 'UPDATE', new: { ...room, name: 'Bathroom' }, old: room } as RealtimePostgresChangesPayload<Room>)
    expect(listener).toHaveBeenCalledWith({ eventType: 'UPDATE', record: { ...room, name: 'Bathroom' } })

    capturedCallback!({ eventType: 'DELETE', new: {}, old: { id: '1' } } as RealtimePostgresChangesPayload<Room>)
    expect(listener).toHaveBeenCalledWith({ eventType: 'DELETE', id: '1' })

    unsubscribe()
    expect(mockRemoveChannel).toHaveBeenCalledWith(fakeChannel)
  })
})

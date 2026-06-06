import { supabase } from '../lib/supabase'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { Tables, TablesInsert, TablesUpdate } from '../types/database'

export type Room = Tables<'rooms'>
export type RoomInsert = TablesInsert<'rooms'>
export type RoomUpdate = TablesUpdate<'rooms'>

export async function listRooms(propertyId: string): Promise<Room[]> {
  const { data, error } = await supabase
    .from('rooms').select('*').eq('property_id', propertyId).order('name')
  if (error) throw error
  return data
}

export async function createRoom(data: RoomInsert): Promise<Room> {
  const { data: row, error } = await supabase.from('rooms').insert(data).select().single()
  if (error) throw error
  return row
}

export async function updateRoom(id: string, data: RoomUpdate): Promise<Room> {
  const { data: row, error } = await supabase
    .from('rooms').update(data).eq('id', id).select().single()
  if (error) throw error
  return row
}

export async function deleteRoom(id: string): Promise<void> {
  const { error } = await supabase.from('rooms').delete().eq('id', id)
  if (error) throw error
}

export type RoomChangeEvent =
  | { eventType: 'INSERT'; record: Room }
  | { eventType: 'UPDATE'; record: Room }
  | { eventType: 'DELETE'; id: string }

export function subscribeToRoomChanges(
  callback: (event: RoomChangeEvent) => void
): () => void {
  const channel = supabase
    .channel(`rooms-${crypto.randomUUID()}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'rooms' },
      (payload: RealtimePostgresChangesPayload<Room>) => {
        if (payload.eventType === 'DELETE') {
          const id = payload.old.id
          if (id) callback({ eventType: 'DELETE', id })
        } else {
          callback({ eventType: payload.eventType, record: payload.new })
        }
      }
    )
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}

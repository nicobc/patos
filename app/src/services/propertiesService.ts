import { supabase } from '../lib/supabase'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { Tables, TablesInsert, TablesUpdate } from '../types/database'

export type Property = Tables<'properties'>
export type PropertyInsert = TablesInsert<'properties'>
export type PropertyUpdate = TablesUpdate<'properties'>

export async function listProperties(): Promise<Property[]> {
  const { data, error } = await supabase.from('properties').select('*').order('name')
  if (error) throw error
  return data
}

export async function createProperty(data: PropertyInsert): Promise<Property> {
  const { data: row, error } = await supabase.from('properties').insert(data).select().single()
  if (error) throw error
  return row
}

export async function updateProperty(id: string, data: PropertyUpdate): Promise<Property> {
  const { data: row, error } = await supabase
    .from('properties').update(data).eq('id', id).select().single()
  if (error) throw error
  return row
}

export async function deleteProperty(id: string): Promise<void> {
  const { error } = await supabase.from('properties').delete().eq('id', id)
  if (error) throw error
}

export async function countProjectsByProperty(id: string): Promise<number> {
  const { count, error } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('property_id', id)
  if (error) throw error
  return count ?? 0
}

export type PropertyChangeEvent =
  | { eventType: 'INSERT'; record: Property }
  | { eventType: 'UPDATE'; record: Property }
  | { eventType: 'DELETE'; id: string }

export function subscribeToPropertyChanges(
  callback: (event: PropertyChangeEvent) => void
): () => void {
  const channel = supabase
    .channel(`properties-${crypto.randomUUID()}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'properties' },
      (payload: RealtimePostgresChangesPayload<Property>) => {
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

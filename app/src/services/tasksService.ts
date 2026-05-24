import { supabase } from '../lib/supabase'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { Tables, TablesInsert, TablesUpdate } from '../types/database'

export type Task = Tables<'tasks'>
export type TaskInsert = TablesInsert<'tasks'>
export type TaskUpdate = TablesUpdate<'tasks'>

export type TaskChangeEvent =
  | { eventType: 'INSERT'; record: Task }
  | { eventType: 'UPDATE'; record: Task }
  | { eventType: 'DELETE'; id: string }

export async function listTasksByProject(projectId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at')
  if (error) throw error
  return data
}

export async function createTask(data: TaskInsert): Promise<Task> {
  const { data: task, error } = await supabase.from('tasks').insert(data).select().single()
  if (error) throw error
  return task
}

export async function updateTask(id: string, data: TaskUpdate): Promise<Task> {
  const { data: task, error } = await supabase
    .from('tasks')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return task
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}

export function subscribeToTaskChanges(
  projectId: string,
  callback: (event: TaskChangeEvent) => void
): () => void {
  const channel = supabase
    .channel(`tasks-${projectId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${projectId}` },
      (payload: RealtimePostgresChangesPayload<Task>) => {
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

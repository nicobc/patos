import { supabase } from '../lib/supabase'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { Tables, TablesInsert, TablesUpdate } from '../types/database'

export type TaskDep = Tables<'task_deps'>

export type Task = Tables<'tasks'>
export type TaskInsert = TablesInsert<'tasks'>
export type TaskUpdate = TablesUpdate<'tasks'>

export type TaskChangeEvent =
  | { eventType: 'INSERT'; record: Task }
  | { eventType: 'UPDATE'; record: Task }
  | { eventType: 'DELETE'; id: string }

export function buildStatusTransition(task: Task, newStatus: string): TaskUpdate {
  const update: TaskUpdate = { status: newStatus }
  if (newStatus === 'in_progress' && !task.actual_start) {
    update.actual_start = new Date().toISOString().split('T')[0]
  }
  if (newStatus === 'done' && !task.actual_end) {
    update.actual_end = new Date().toISOString().split('T')[0]
  }
  return update
}

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

export async function listBlockers(taskId: string): Promise<Task[]> {
  const { data: deps, error: depsError } = await supabase
    .from('task_deps')
    .select('depends_on_task_id')
    .eq('task_id', taskId)
  if (depsError) throw depsError
  if (deps.length === 0) return []
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .in('id', deps.map((d) => d.depends_on_task_id))
  if (tasksError) throw tasksError
  return tasks
}

export async function listBlocks(taskId: string): Promise<Task[]> {
  const { data: deps, error: depsError } = await supabase
    .from('task_deps')
    .select('task_id')
    .eq('depends_on_task_id', taskId)
  if (depsError) throw depsError
  if (deps.length === 0) return []
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .in('id', deps.map((d) => d.task_id))
  if (tasksError) throw tasksError
  return tasks
}

export async function setBlockers(taskId: string, blockerIds: string[]): Promise<void> {
  const { error } = await supabase.rpc('set_blockers', {
    p_task_id: taskId,
    p_blocker_ids: blockerIds,
  })
  if (error) throw error
}

export async function listRawDepsByTasks(taskIds: string[]): Promise<TaskDep[]> {
  if (taskIds.length === 0) return []
  const { data, error } = await supabase
    .from('task_deps')
    .select('task_id, depends_on_task_id')
    .in('task_id', taskIds)
  if (error) throw error
  return data
}

export type DepChangeEvent =
  | { eventType: 'INSERT'; taskId: string; blockerTaskId: string }
  | { eventType: 'DELETE'; taskId: string; blockerTaskId: string }

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

export function subscribeToDepsChanges(
  projectId: string,
  callback: (event: DepChangeEvent) => void
): () => void {
  type DepRow = { task_id: string; depends_on_task_id: string }
  const channel = supabase
    .channel(`task-deps-${projectId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'task_deps' },
      (payload: RealtimePostgresChangesPayload<DepRow>) => {
        const rec = payload.new as DepRow
        callback({ eventType: 'INSERT', taskId: rec.task_id, blockerTaskId: rec.depends_on_task_id })
      }
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'task_deps' },
      (payload: RealtimePostgresChangesPayload<DepRow>) => {
        const rec = payload.old as Partial<DepRow>
        if (rec.task_id && rec.depends_on_task_id) {
          callback({ eventType: 'DELETE', taskId: rec.task_id, blockerTaskId: rec.depends_on_task_id })
        }
      }
    )
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}

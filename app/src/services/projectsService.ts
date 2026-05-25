import { supabase } from '../lib/supabase'
import type { Tables, TablesInsert, TablesUpdate } from '../types/database'

export type Project = Tables<'projects'>
export type ProjectInsert = TablesInsert<'projects'>
export type ProjectUpdate = TablesUpdate<'projects'>

export async function listProjects(): Promise<Project[]> {
  const { data, error } = await supabase.from('projects').select('*').order('name')
  if (error) throw error
  return data
}

export async function createProject(data: ProjectInsert): Promise<Project> {
  const { data: row, error } = await supabase.from('projects').insert(data).select().single()
  if (error) throw error
  return row
}

export async function updateProject(id: string, data: ProjectUpdate): Promise<Project> {
  const { data: row, error } = await supabase
    .from('projects').update(data).eq('id', id).select().single()
  if (error) throw error
  return row
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw error
}

export async function countTasksByProject(id: string): Promise<number> {
  const { count, error } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', id)
  if (error) throw error
  return count ?? 0
}

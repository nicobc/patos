import { supabase } from '../lib/supabase'
import type { Tables } from '../types/database'

export type Project = Tables<'projects'>

export async function listProjects(): Promise<Project[]> {
  const { data, error } = await supabase.from('projects').select('*').order('name')
  if (error) throw error
  return data
}

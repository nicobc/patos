import { supabase } from '../lib/supabase'
import type { Tables, TablesInsert, TablesUpdate } from '../types/database'

export type Contractor = Tables<'contractors'>
export type ContractorInsert = TablesInsert<'contractors'>
export type ContractorUpdate = TablesUpdate<'contractors'>

export async function listContractors(): Promise<Contractor[]> {
  const { data, error } = await supabase.from('contractors').select('*').order('name')
  if (error) throw error
  return data
}

export async function createContractor(data: ContractorInsert): Promise<Contractor> {
  const { data: row, error } = await supabase.from('contractors').insert(data).select().single()
  if (error) throw error
  return row
}

export async function updateContractor(id: string, data: ContractorUpdate): Promise<Contractor> {
  const { data: row, error } = await supabase
    .from('contractors').update(data).eq('id', id).select().single()
  if (error) throw error
  return row
}

export async function deleteContractor(id: string): Promise<void> {
  const { error } = await supabase.from('contractors').delete().eq('id', id)
  if (error) throw error
}

export async function countTasksByContractor(id: string): Promise<number> {
  const { count, error } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('contractor_id', id)
  if (error) throw error
  return count ?? 0
}

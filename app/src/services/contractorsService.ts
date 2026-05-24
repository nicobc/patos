import { supabase } from '../lib/supabase'
import type { Tables } from '../types/database'

export type Contractor = Tables<'contractors'>

export async function listContractors(): Promise<Contractor[]> {
  const { data, error } = await supabase.from('contractors').select('*').order('name')
  if (error) throw error
  return data
}

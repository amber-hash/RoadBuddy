import { supabase } from "@/lib/supabase/client"
import { DriverState } from "@/types/truck"

export interface DriverResponse {
  name: string
  vehicle_id: string
  state: DriverState
}

export async function getDrivers(): Promise<DriverResponse[]> {
  const { data, error } = await supabase
    .from('drivers')
    .select('name, vehicle_id, state')

  if (error) {
    console.error('Error fetching drivers:', error)
    return []
  }

  return data as DriverResponse[]
}

export async function getDriverById(id: string): Promise<DriverResponse | null> {
  const { data, error } = await supabase
    .from('drivers')
    .select('name, vehicle_id, state')
    .or(`vehicle_id.eq.${id}`)
    .maybeSingle()

  if (error) {
    console.error('Error fetching driver:', error)
    return null
  }

  return data as DriverResponse
}

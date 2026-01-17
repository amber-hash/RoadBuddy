export type DriverState = "Normal" | "Drowsy" | "Asleep"

export interface TruckData {
  truck_id: string
  driver_id: string
  driver_name: string
  lat: number
  long: number
  driver_state: DriverState
  lastUpdate: Date
  phone?: string
  license?: string
  joinedDate?: string
}

export interface StateChange {
  timestamp: Date
  previousState: DriverState
  newState: DriverState
  lat: number
  long: number
}

export interface Notification {
  id: string
  truck_id: string
  driver_id: string
  driver_name: string
  state: DriverState
  timestamp: Date
  lat: number
  long: number
  acknowledged: boolean
}

export interface FleetState {
  trucks: Map<string, TruckData>
  notifications: Notification[]
  sseConnected: boolean
  lastUpdate: Date | null
}

"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { TruckData, Notification, DriverState } from "@/types/truck"
import { DriverResponse } from "@/api/api"

interface SSEState {
  trucks: Map<string, TruckData>
  notifications: Notification[]
  connected: boolean
  lastUpdate: Date | null
}

export function useSSE() {
  const [state, setState] = useState<SSEState>({
    trucks: new Map(),
    notifications: [],
    connected: false,
    lastUpdate: null,
  })

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const trucksRef = useRef<Map<string, TruckData>>(new Map())

  const fetchDrivers = useCallback(async () => {
    try {
      const response = await fetch('/api/drivers')
      if (!response.ok) throw new Error('Failed to fetch drivers')
      const drivers: DriverResponse[] = await response.json()
      
      const trucksMap = new Map<string, TruckData>()
      const initialNotifications: Notification[] = []
      
      drivers.forEach((driver, index) => {
        // Since API only returns partial data, we still simulate some fields for the UI
        // In a real app, these should come from the DB too
        const truckData: TruckData = {
          truck_id: driver.vehicle_id,
          driver_id: `${index + 1}`, // Generate a driver ID since it's not in the DB
          driver_name: driver.name,
          driver_state: driver.state,
          lat: 34.0522 + (Math.random() - 0.5) * 2,
          long: -118.2437 + (Math.random() - 0.5) * 2,
          lastUpdate: new Date(),
          phone: `(555) ${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
          license: `CDL-${String(Math.floor(Math.random() * 900000) + 100000)}`,
          joinedDate: `${["Jan", "Feb", "Mar", "Apr", "May", "Jun"][Math.floor(Math.random() * 6)]} 202${Math.floor(Math.random() * 4) + 1}`,
        }

        trucksMap.set(truckData.truck_id, truckData)

        if (truckData.driver_state !== "Normal") {
          initialNotifications.push({
            id: `${truckData.truck_id}-${Date.now()}`,
            truck_id: truckData.truck_id,
            driver_id: truckData.driver_id,
            driver_name: truckData.driver_name,
            state: truckData.driver_state,
            timestamp: new Date(),
            lat: truckData.lat,
            long: truckData.long,
            acknowledged: false,
          })
        }
      })

      trucksRef.current = trucksMap
      setState({
        trucks: trucksMap,
        notifications: initialNotifications,
        connected: true,
        lastUpdate: new Date(),
      })

    } catch (error) {
      console.error('Error initializing data:', error)
    }
  }, [])

  const simulateRealtimeUpdates = useCallback(() => {
    intervalRef.current = setInterval(() => {
      const trucks = trucksRef.current
      const truckArray = Array.from(trucks.values())

      if (truckArray.length === 0) return

      // Randomly update 1-3 trucks
      const updateCount = Math.floor(Math.random() * 3) + 1
      const newNotifications: Notification[] = []

      for (let i = 0; i < updateCount; i++) {
        const randomIndex = Math.floor(Math.random() * truckArray.length)
        const truck = truckArray[randomIndex]

        // Update position slightly
        const updatedTruck: TruckData = {
          ...truck,
          lat: truck.lat + (Math.random() - 0.5) * 0.01,
          long: truck.long + (Math.random() - 0.5) * 0.01,
          lastUpdate: new Date(),
        }

        // Occasionally change state
        if (Math.random() < 0.1) {
          const states: DriverState[] = ["Normal", "Drowsy", "Asleep"]
          const newState = states[Math.floor(Math.random() * states.length)]

          if (newState !== truck.driver_state) {
            updatedTruck.driver_state = newState

            if (newState !== "Normal") {
              newNotifications.push({
                id: `${truck.truck_id}-${Date.now()}`,
                truck_id: truck.truck_id,
                driver_id: truck.driver_id,
                driver_name: truck.driver_name,
                state: newState,
                timestamp: new Date(),
                lat: updatedTruck.lat,
                long: updatedTruck.long,
                acknowledged: false,
              })
            }
          }
        }

        trucks.set(truck.truck_id, updatedTruck)
      }

      trucksRef.current = trucks

      setState((prev) => ({
        ...prev,
        trucks: new Map(trucks),
        notifications: [...newNotifications, ...prev.notifications].slice(0, 100),
        lastUpdate: new Date(),
      }))
    }, 3000)
  }, [])

  useEffect(() => {
    // Initial fetch
    fetchDrivers().then(() => {
      // Start simulation after data is loaded
      simulateRealtimeUpdates()
    })

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [fetchDrivers, simulateRealtimeUpdates])

  const acknowledgeNotification = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, acknowledged: true } : n)),
    }))
  }, [])

  return {
    ...state,
    acknowledgeNotification,
  }
}

"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { TruckData, Notification, DriverState } from "@/types/truck"

interface SSEState {
  trucks: Map<string, TruckData>
  notifications: Notification[]
  connected: boolean
  lastUpdate: Date | null
}

// Mock data generator for demo purposes
function generateMockTrucks(): TruckData[] {
  const states: DriverState[] = ["Normal", "Normal", "Normal", "Drowsy", "Asleep"]
  const names = [
    "Alice Johnson",
    "Bob Smith",
    "Carol Williams",
    "David Brown",
    "Eva Martinez",
    "Frank Garcia",
    "Grace Lee",
    "Henry Wilson",
    "Ivy Chen",
    "Jack Taylor",
    "Karen White",
    "Leo Harris",
    "Maya Clark",
    "Nathan Lewis",
    "Olivia Hall",
  ]

  return names.map((name, index) => ({
    truck_id: `T-${String(100 + index).padStart(3, "0")}`,
    driver_id: `${index + 1}`,
    driver_name: name,
    lat: 34.0522 + (Math.random() - 0.5) * 2,
    long: -118.2437 + (Math.random() - 0.5) * 2,
    driver_state: states[Math.floor(Math.random() * states.length)],
    lastUpdate: new Date(),
    phone: `(555) ${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    license: `CDL-${String(Math.floor(Math.random() * 900000) + 100000)}`,
    joinedDate: `${["Jan", "Feb", "Mar", "Apr", "May", "Jun"][Math.floor(Math.random() * 6)]} 202${Math.floor(Math.random() * 4) + 1}`,
  }))
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

  const simulateSSE = useCallback(() => {
    // Initialize with mock data
    const initialTrucks = generateMockTrucks()
    const trucksMap = new Map<string, TruckData>()
    const initialNotifications: Notification[] = []

    initialTrucks.forEach((truck) => {
      trucksMap.set(truck.truck_id, truck)
      if (truck.driver_state !== "Normal") {
        initialNotifications.push({
          id: `${truck.truck_id}-${Date.now()}`,
          truck_id: truck.truck_id,
          driver_id: truck.driver_id,
          driver_name: truck.driver_name,
          state: truck.driver_state,
          timestamp: new Date(),
          lat: truck.lat,
          long: truck.long,
          acknowledged: false,
        })
      }
    })

    trucksRef.current = trucksMap

    setState({
      trucks: new Map(trucksMap),
      notifications: initialNotifications,
      connected: true,
      lastUpdate: new Date(),
    })

    // Simulate real-time updates
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
    simulateSSE()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [simulateSSE])

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

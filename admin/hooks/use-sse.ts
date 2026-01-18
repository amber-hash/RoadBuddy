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

  const trucksRef = useRef<Map<string, TruckData>>(new Map())

  const fetchDrivers = useCallback(async () => {
    try {
      const res = await fetch("/api/drivers")
      if (!res.ok) {
        console.error('Failed to fetch drivers:', res.status, res.statusText)
        return
      }

      const drivers: DriverResponse[] = await res.json()
      console.log('Fetched drivers:', drivers)

      const map = new Map<string, TruckData>()

      drivers.forEach((driver, index) => {
        // Convert vehicle_id to string for consistent map keys
        const vehicleId = String(driver.vehicle_id)
        map.set(vehicleId, {
          truck_id: vehicleId,
          driver_id: String(index + 1),
          driver_name: driver.name,
          driver_state: driver.state,
          lat: 0,
          long: 0,
          lastUpdate: new Date(),
          phone: "",
          license: "",
          joinedDate: "",
        })
      })

      trucksRef.current = map
      setState(prev => ({ ...prev, trucks: map }))
      console.log('Loaded trucks into store:', map.size, 'trucks')
    } catch (error) {
      console.error('Error fetching drivers:', error)
    }
  }, [])

  /**
   * 2️⃣ Live SSE updates
   */
  const startSSE = useCallback(() => {
    const source = new EventSource("/api/drivers/sse")

    source.onopen = () => {
      console.log('[SSE] Connected to event stream')
      setState(prev => ({ ...prev, connected: true }))
    }

    source.onmessage = (event) => {
      console.log('[SSE] Received message:', event.data)

      let msg
      try {
        msg = JSON.parse(event.data)
      } catch (error) {
        console.log('[SSE] Non-JSON message (heartbeat or comment):', event.data)
        return
      }

      if (msg.type !== "DRIVER_TELEMETRY") {
        console.log('[SSE] Ignoring non-telemetry message:', msg.type)
        return
      }

      console.log('[SSE] Processing telemetry for driver:', msg.driver_id)

      // Find truck by vehicle_id (which matches driver_id in the message)
      // Convert to string to ensure consistent map key type
      const driverId = String(msg.driver_id)
      const existing = trucksRef.current.get(driverId)
      if (!existing) {
        console.warn(`[SSE] Received update for unknown driver: ${msg.driver_id}. Available drivers:`, Array.from(trucksRef.current.keys()))
        return
      }

      const updated: TruckData = {
        ...existing,
        lat: msg.location.lat,
        long: msg.location.lon,
        driver_state: msg.state,
        lastUpdate: new Date(),
      }

      console.log('[SSE] Updated truck data:', updated)

      const newTrucks = new Map(trucksRef.current)
      newTrucks.set(driverId, updated)
      trucksRef.current = newTrucks

      const notifications: Notification[] = []

      if (
        updated.driver_state !== "Normal" &&
        updated.driver_state !== existing.driver_state
      ) {
        console.log('[SSE] State change detected:', existing.driver_state, '->', updated.driver_state)
        notifications.push({
          id: `${updated.truck_id}-${Date.now()}`,
          truck_id: updated.truck_id,
          driver_id: updated.driver_id,
          driver_name: updated.driver_name,
          state: updated.driver_state,
          timestamp: new Date(),
          lat: updated.lat,
          long: updated.long,
          acknowledged: false,
        })
      }

      setState(prev => ({
        ...prev,
        trucks: newTrucks,
        notifications: [...notifications, ...prev.notifications].slice(0, 100),
        lastUpdate: new Date(),
      }))

      console.log('[SSE] State updated, total trucks:', newTrucks.size)
    }

    source.onerror = (error) => {
      console.error('[SSE] Connection error:', error)
      setState(prev => ({ ...prev, connected: false }))
      source.close()
    }

    return source
  }, [])

  /**
   * 3️⃣ Lifecycle
   */
  useEffect(() => {
    let source: EventSource | null = null

    fetchDrivers().then(() => {
      source = startSSE()
    })

    return () => {
      source?.close()
    }
  }, [fetchDrivers, startSSE])

  const acknowledgeNotification = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n =>
        n.id === id ? { ...n, acknowledged: true } : n
      ),
    }))
  }, [])

  return {
    ...state,
    acknowledgeNotification,
  }
}
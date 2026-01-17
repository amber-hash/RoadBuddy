"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useSSE } from "./use-sse"
import type { TruckData, Notification } from "@/types/truck"

interface TruckStoreContextType {
  trucks: Map<string, TruckData>
  notifications: Notification[]
  connected: boolean
  lastUpdate: Date | null
  acknowledgeNotification: (id: string) => void
}

const TruckStoreContext = createContext<TruckStoreContextType | null>(null)

export function TruckStoreProvider({ children }: { children: ReactNode }) {
  const store = useSSE()

  return <TruckStoreContext.Provider value={store}>{children}</TruckStoreContext.Provider>
}

export function useTruckStore() {
  const context = useContext(TruckStoreContext)
  if (!context) {
    throw new Error("useTruckStore must be used within a TruckStoreProvider")
  }
  return context
}

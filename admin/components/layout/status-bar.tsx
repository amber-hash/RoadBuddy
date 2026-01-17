"use client"

import { useTruckStore } from "@/hooks/use-truck-store"
import { formatRelativeTime } from "@/lib/utils/time"
import { useMemo } from "react"

export function StatusBar() {
  const { trucks, notifications, lastUpdate, connected } = useTruckStore()

  const stats = useMemo(() => {
    const truckArray = Array.from(trucks.values())
    const asleepCount = truckArray.filter((t) => t.driver_state === "Asleep").length
    const drowsyCount = truckArray.filter((t) => t.driver_state === "Drowsy").length

    return {
      total: truckArray.length,
      alerts: asleepCount + drowsyCount,
      asleep: asleepCount,
      drowsy: drowsyCount,
    }
  }, [trucks])

  return (
    <footer className="h-10 border-t bg-muted/50 px-6 flex items-center justify-between text-sm text-muted-foreground">
      <div className="flex items-center gap-6">
        <span>Last updated: {lastUpdate ? formatRelativeTime(lastUpdate) : "Never"}</span>
        <span>Active Trucks: {stats.total}</span>
        <span className={stats.alerts > 0 ? "text-red-600 font-medium" : ""}>
          Active Alerts: {stats.alerts}
          {stats.alerts > 0 && ` (${stats.asleep} asleep, ${stats.drowsy} drowsy)`}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className={`flex items-center gap-1.5 ${connected ? "text-green-600" : "text-red-600"}`}>
          <span className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`} />
          SSE {connected ? "Connected" : "Disconnected"}
        </span>
      </div>
    </footer>
  )
}

"use client"

import { useState, useMemo } from "react"
import { useTruckStore } from "@/hooks/use-truck-store"
import { AlertCard } from "./alert-card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Bell, AlertTriangle, AlertCircle } from "lucide-react"

export function NotificationPanel() {
  const { notifications, acknowledgeNotification } = useTruckStore()
  const [filter, setFilter] = useState<"all" | "asleep" | "drowsy">("all")

  const filteredNotifications = useMemo(() => {
    const unacknowledged = notifications.filter((n) => !n.acknowledged)

    switch (filter) {
      case "asleep":
        return unacknowledged.filter((n) => n.state === "Asleep")
      case "drowsy":
        return unacknowledged.filter((n) => n.state === "Drowsy")
      default:
        return unacknowledged
    }
  }, [notifications, filter])

  const asleepCount = notifications.filter((n) => n.state === "Asleep" && !n.acknowledged).length
  const drowsyCount = notifications.filter((n) => n.state === "Drowsy" && !n.acknowledged).length

  const criticalAlerts = filteredNotifications.filter((n) => n.state === "Asleep")
  const warningAlerts = filteredNotifications.filter((n) => n.state === "Drowsy")

  return (
    <div className="h-full flex flex-col bg-background border-l">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5" />
          <h2 className="font-semibold text-lg">Notifications</h2>
        </div>

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">
              All
              <Badge variant="secondary" className="ml-2">
                {asleepCount + drowsyCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="asleep" className="flex-1">
              Asleep
              {asleepCount > 0 && <Badge className="ml-2 bg-red-500">{asleepCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="drowsy" className="flex-1">
              Drowsy
              {drowsyCount > 0 && <Badge className="ml-2 bg-yellow-500 text-yellow-900">{drowsyCount}</Badge>}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Critical Alerts Section */}
          {criticalAlerts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <h3 className="font-medium text-sm text-red-600">Critical Alerts ({criticalAlerts.length})</h3>
              </div>
              <div className="space-y-3">
                {criticalAlerts.map((notification) => (
                  <AlertCard
                    key={notification.id}
                    notification={notification}
                    onAcknowledge={() => acknowledgeNotification(notification.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Warning Alerts Section */}
          {warningAlerts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <h3 className="font-medium text-sm text-yellow-700">Warnings ({warningAlerts.length})</h3>
              </div>
              <div className="space-y-3">
                {warningAlerts.map((notification) => (
                  <AlertCard
                    key={notification.id}
                    notification={notification}
                    onAcknowledge={() => acknowledgeNotification(notification.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {filteredNotifications.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No active alerts</p>
              <p className="text-sm">All drivers are operating normally</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

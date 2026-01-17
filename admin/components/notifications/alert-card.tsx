"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatRelativeTime } from "@/lib/utils/time"
import { MapPin, Eye, Check } from "lucide-react"
import Link from "next/link"
import type { Notification } from "@/types/truck"

interface AlertCardProps {
  notification: Notification
  onAcknowledge: () => void
}

export function AlertCard({ notification, onAcknowledge }: AlertCardProps) {
  const isCritical = notification.state === "Asleep"

  return (
    <Card
      className={`p-4 transition-all ${
        isCritical
          ? "border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900"
          : "border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Status Icon */}
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            isCritical ? "bg-red-500" : "bg-yellow-500"
          }`}
        >
          <span className="text-white text-lg">{isCritical ? "!" : "⚠"}</span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">Driver #{notification.driver_id}</span>
            <Badge
              className={
                isCritical ? "bg-red-500 hover:bg-red-600" : "bg-yellow-500 hover:bg-yellow-600 text-yellow-900"
              }
            >
              {notification.state.toUpperCase()}
            </Badge>
          </div>

          {/* Details */}
          <p className="text-sm text-muted-foreground mt-1">{notification.driver_name}</p>
          <p className="text-sm text-muted-foreground">Truck {notification.truck_id}</p>

          {/* Location */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
            <MapPin className="w-3 h-3" />
            <span>
              {notification.lat.toFixed(4)}, {notification.long.toFixed(4)}
            </span>
          </div>

          {/* Time */}
          <p className="text-xs text-muted-foreground mt-1">{formatRelativeTime(notification.timestamp)}</p>

          {/* Actions */}
          <div className="flex gap-2 mt-3">
            <Link href={`/drivers/${notification.driver_id}`}>
              <Button size="sm" variant="outline" className="h-8 bg-transparent">
                <Eye className="w-3 h-3 mr-1" />
                View
              </Button>
            </Link>
            <Button size="sm" variant="ghost" className="h-8" onClick={onAcknowledge}>
              <Check className="w-3 h-3 mr-1" />
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

"use client"

import { useMemo, useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { useTruckStore } from "@/hooks/use-truck-store"
import { formatRelativeTime, formatTime } from "@/lib/utils/time"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Phone, Bell, MapPin, Clock, User, Truck, FileText, Calendar, Activity } from "lucide-react"
import type { DriverState, StateChange } from "@/types/truck"

const stateBgColors: Record<DriverState, string> = {
  Normal: "bg-green-500",
  Drowsy: "bg-yellow-500 text-yellow-900",
  Asleep: "bg-red-500",
}

const stateTextColors: Record<DriverState, string> = {
  Normal: "text-green-600",
  Drowsy: "text-yellow-600",
  Asleep: "text-red-600",
}

// Dynamically import the map component to avoid SSR issues with Leaflet
const TruckMapLeaflet = dynamic(
  () => import("@/components/map/truck-map-leaflet").then((mod) => mod.TruckMapLeaflet),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-slate-900 rounded-lg flex items-center justify-center">
        <p className="text-white text-sm">Loading map...</p>
      </div>
    )
  }
)

interface DriverDetailProps {
  driverId: string
}

export function DriverDetail({ driverId }: DriverDetailProps) {
  const { trucks } = useTruckStore()
  const [statusHistory, setStatusHistory] = useState<StateChange[]>([])

  const driver = useMemo(() => {
    // Try to find by truck_id (vehicle_id) first, then fall back to driver_id
    return trucks.get(driverId) || Array.from(trucks.values()).find((t) => t.driver_id === driverId)
  }, [trucks, driverId])

  // Simulate status history
  useEffect(() => {
    if (driver) {
      const now = new Date()
      const mockHistory: StateChange[] = [
        {
          timestamp: new Date(now.getTime() - 5 * 60 * 1000),
          previousState: "Drowsy",
          newState: driver.driver_state,
          lat: driver.lat,
          long: driver.long,
        },
        {
          timestamp: new Date(now.getTime() - 30 * 60 * 1000),
          previousState: "Normal",
          newState: "Drowsy",
          lat: driver.lat - 0.01,
          long: driver.long - 0.01,
        },
        {
          timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
          previousState: "Normal",
          newState: "Normal",
          lat: driver.lat - 0.05,
          long: driver.long - 0.05,
        },
      ]
      setStatusHistory(mockHistory)
    }
  }, [driver])

  if (!driver) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Driver not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Driver Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Driver Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-xl">{driver.driver_name}</h3>
                <p className="text-muted-foreground">Driver #{driver.driver_id}</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Truck:</span>
                <span className="font-medium">{driver.truck_id}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Phone:</span>
                <span className="font-medium">{driver.phone || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">License:</span>
                <span className="font-medium">{driver.license || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Joined:</span>
                <span className="font-medium">{driver.joinedDate || "N/A"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Status Card */}
        <Card
          className={
            driver.driver_state === "Asleep"
              ? "border-red-200 bg-red-50/50 dark:bg-red-950/20"
              : driver.driver_state === "Drowsy"
                ? "border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20"
                : ""
          }
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Current Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center ${stateBgColors[driver.driver_state]}`}
              >
                <span className="text-white text-2xl font-bold">
                  {driver.driver_state === "Normal" ? "✓" : driver.driver_state === "Drowsy" ? "⚠" : "!"}
                </span>
              </div>
              <div>
                <Badge className={`text-lg px-4 py-1 ${stateBgColors[driver.driver_state]}`}>
                  {driver.driver_state.toUpperCase()}
                </Badge>
                <p className="text-sm text-muted-foreground mt-2">Since: {formatRelativeTime(driver.lastUpdate)}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="font-mono">
                  {driver.lat.toFixed(4)}, {driver.long.toFixed(4)}
                </span>
              </div>
              <p className="text-muted-foreground ml-6">Los Angeles, CA</p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button className="flex-1">
                <Phone className="w-4 h-4 mr-2" />
                Call Driver
              </Button>
              <Button variant="outline" className="flex-1 bg-transparent">
                <Bell className="w-4 h-4 mr-2" />
                Send Alert
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Current Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] rounded-lg overflow-hidden">
            <TruckMapLeaflet singleTruck={driver} showControls={false} />
          </div>
        </CardContent>
      </Card>

      {/* Status History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Status History (Last 24 Hours)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {statusHistory.map((change, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${stateBgColors[change.newState]}`} />
                  {index < statusHistory.length - 1 && <div className="w-px h-full min-h-[40px] bg-border" />}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{formatTime(change.timestamp)}</span>
                    <Badge variant="outline" className={stateTextColors[change.newState]}>
                      {change.newState}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {change.previousState} → {change.newState} at ({change.lat.toFixed(4)}, {change.long.toFixed(4)})
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Button variant="outline" className="w-full mt-4 bg-transparent">
            View Full History
          </Button>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">6.5h</p>
              <p className="text-sm text-muted-foreground">Hours Driven</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">2</p>
              <p className="text-sm text-muted-foreground">Drowsy Incidents</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">245 mi</p>
              <p className="text-sm text-muted-foreground">Distance Covered</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">3 min</p>
              <p className="text-sm text-muted-foreground">Avg Response Time</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

}

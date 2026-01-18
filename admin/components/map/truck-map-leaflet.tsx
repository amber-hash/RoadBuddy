"use client"

import { useEffect, useMemo, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { useTruckStore } from "@/hooks/use-truck-store"
import type { TruckData, DriverState } from "@/types/truck"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"
import Link from "next/link"

const stateColors: Record<DriverState, string> = {
  Normal: "#22c55e",
  Drowsy: "#eab308",
  Asleep: "#ef4444",
}

const stateBgColors: Record<DriverState, string> = {
  Normal: "bg-green-500",
  Drowsy: "bg-yellow-500",
  Asleep: "bg-red-500",
}

// Create custom marker icons
const createTruckIcon = (state: DriverState) => {
  const color = stateColors[state]
  return L.divIcon({
    html: `
      <div style="position: relative;">
        ${state !== "Normal" ? `<div style="position: absolute; inset: 0; width: 32px; height: 32px; margin: -4px; border-radius: 50%; background-color: ${color}; animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite; opacity: 0.75;"></div>` : ""}
        <div style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; background-color: ${color}; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
            <path d="M18 18.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zM19.5 9.5l1.96 2.5H17V9.5h2.5zM6 18.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zM20 8l3 4v5h-2c0 1.66-1.34 3-3 3s-3-1.34-3-3H9c0 1.66-1.34 3-3 3s-3-1.34-3-3H1V6c0-1.11.89-2 2-2h14v4h3z" />
          </svg>
        </div>
      </div>
    `,
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

// Component to handle map bounds updates
function MapBoundsHandler({ trucks }: { trucks: TruckData[] }) {
  const map = useMap()

  useEffect(() => {
    if (trucks.length === 0) return

    const validTrucks = trucks.filter(t => t.lat !== 0 && t.long !== 0)
    if (validTrucks.length === 0) return

    const bounds = L.latLngBounds(
      validTrucks.map(t => [t.lat, t.long] as [number, number])
    )

    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 })
  }, [trucks, map])

  return null
}

interface TruckMapProps {
  singleTruck?: TruckData
  showControls?: boolean
  className?: string
}

export function TruckMapLeaflet({ singleTruck, showControls = true, className = "" }: TruckMapProps) {
  const { trucks } = useTruckStore()
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<DriverState | "All">("All")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const displayTrucks = useMemo(() => {
    if (singleTruck) return [singleTruck]

    let truckList = Array.from(trucks.values())

    if (filter !== "All") {
      truckList = truckList.filter((t) => t.driver_state === filter)
    }

    if (search) {
      const searchLower = search.toLowerCase()
      truckList = truckList.filter(
        (t) =>
          t.driver_name.toLowerCase().includes(searchLower) ||
          t.truck_id.toLowerCase().includes(searchLower) ||
          t.driver_id.includes(searchLower),
      )
    }

    return truckList.filter(t => t.lat !== 0 && t.long !== 0)
  }, [trucks, singleTruck, filter, search])

  // Default center (Los Angeles area)
  const center: [number, number] = useMemo(() => {
    if (displayTrucks.length === 0) return [34.0522, -118.2437]

    const avgLat = displayTrucks.reduce((sum, t) => sum + t.lat, 0) / displayTrucks.length
    const avgLong = displayTrucks.reduce((sum, t) => sum + t.long, 0) / displayTrucks.length

    return [avgLat, avgLong]
  }, [displayTrucks])

  if (!mounted) {
    return (
      <div className={`relative h-full w-full bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center ${className}`}>
        <p className="text-white">Loading map...</p>
      </div>
    )
  }

  return (
    <div className={`relative h-full w-full rounded-lg overflow-hidden ${className}`}>
      <MapContainer
        center={center}
        zoom={10}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBoundsHandler trucks={displayTrucks} />

        {displayTrucks.map((truck) => (
          <Marker
            key={truck.truck_id}
            position={[truck.lat, truck.long]}
            icon={createTruckIcon(truck.driver_state)}
          >
            <Popup>
              <div className="p-2">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-sm">{truck.driver_name}</h3>
                  <Badge className={`text-xs ${stateBgColors[truck.driver_state]}`}>
                    {truck.driver_state}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Driver #{truck.driver_id} • {truck.truck_id}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {truck.lat.toFixed(4)}, {truck.long.toFixed(4)}
                </p>
                <Link href={`/drivers/${truck.truck_id}`}>
                  <Button className="w-full mt-2" size="sm">
                    View Details
                  </Button>
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Controls Overlay */}
      {showControls && (
        <div className="absolute top-4 left-4 right-4 flex gap-2 z-[1000] pointer-events-none">
          <div className="relative flex-1 max-w-xs pointer-events-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search driver or truck..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white/90 backdrop-blur border-0 shadow-lg"
            />
          </div>

          {/* Filter buttons */}
          <div className="flex gap-1 bg-white/90 backdrop-blur rounded-md p-1 shadow-lg pointer-events-auto">
            {(["All", "Normal", "Drowsy", "Asleep"] as const).map((state) => (
              <Button
                key={state}
                size="sm"
                variant={filter === state ? "default" : "ghost"}
                onClick={() => setFilter(state)}
                className={filter === state && state !== "All" ? stateBgColors[state] : ""}
              >
                {state}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur rounded-lg px-4 py-2 shadow-lg flex gap-4 text-sm z-[1000]">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Normal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span>Drowsy</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Asleep</span>
        </div>
      </div>

      <style jsx global>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}

"use client"

import { useRef, useState, useMemo } from "react"
import { useTruckStore } from "@/hooks/use-truck-store"
import type { TruckData, DriverState } from "@/types/truck"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, ZoomIn, ZoomOut, Locate, X } from "lucide-react"
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

interface TruckMapProps {
  singleTruck?: TruckData
  showControls?: boolean
  className?: string
}

export function TruckMap({ singleTruck, showControls = true, className = "" }: TruckMapProps) {
  const { trucks } = useTruckStore()
  const mapRef = useRef<HTMLDivElement>(null)
  const [selectedTruck, setSelectedTruck] = useState<TruckData | null>(null)
  const [search, setSearch] = useState("")
  const [zoom, setZoom] = useState(1)
  const [filter, setFilter] = useState<DriverState | "All">("All")

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

    return truckList
  }, [trucks, singleTruck, filter, search])

  // Calculate map bounds
  const bounds = useMemo(() => {
    if (displayTrucks.length === 0) {
      return { minLat: 33, maxLat: 35, minLong: -119, maxLong: -117 }
    }

    const lats = displayTrucks.map((t) => t.lat)
    const longs = displayTrucks.map((t) => t.long)

    return {
      minLat: Math.min(...lats) - 0.1,
      maxLat: Math.max(...lats) + 0.1,
      minLong: Math.min(...longs) - 0.1,
      maxLong: Math.max(...longs) + 0.1,
    }
  }, [displayTrucks])

  const latLongToXY = (lat: number, long: number) => {
    const x = ((long - bounds.minLong) / (bounds.maxLong - bounds.minLong)) * 100
    const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * 100
    return { x, y }
  }

  return (
    <div className={`relative h-full w-full bg-slate-900 rounded-lg overflow-hidden ${className}`}>
      {/* Map Background */}
      <div
        ref={mapRef}
        className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(16, 185, 129, 0.1) 0%, transparent 50%),
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "100% 100%, 100% 100%, 40px 40px, 40px 40px",
          transform: `scale(${zoom})`,
          transformOrigin: "center",
        }}
        onClick={() => setSelectedTruck(null)}
      >
        {/* Truck Markers */}
        {displayTrucks.map((truck) => {
          const { x, y } = latLongToXY(truck.lat, truck.long)
          const isSelected = selectedTruck?.truck_id === truck.truck_id

          return (
            <div
              key={truck.truck_id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-110"
              style={{ left: `${x}%`, top: `${y}%` }}
              onClick={(e) => {
                e.stopPropagation()
                setSelectedTruck(truck)
              }}
            >
              {/* Pulsing ring for alerts */}
              {truck.driver_state !== "Normal" && (
                <div
                  className={`absolute inset-0 rounded-full animate-ping opacity-75 ${stateBgColors[truck.driver_state]}`}
                  style={{ width: "32px", height: "32px", margin: "-4px" }}
                />
              )}

              {/* Marker */}
              <div
                className={`w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold transition-all ${
                  isSelected ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900" : ""
                }`}
                style={{ backgroundColor: stateColors[truck.driver_state] }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 18.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zM19.5 9.5l1.96 2.5H17V9.5h2.5zM6 18.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zM20 8l3 4v5h-2c0 1.66-1.34 3-3 3s-3-1.34-3-3H9c0 1.66-1.34 3-3 3s-3-1.34-3-3H1V6c0-1.11.89-2 2-2h14v4h3z" />
                </svg>
              </div>
            </div>
          )
        })}
      </div>

      {/* Controls */}
      {showControls && (
        <>
          {/* Search */}
          <div className="absolute top-4 left-4 right-4 flex gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search driver or truck..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-white/90 backdrop-blur border-0 shadow-lg"
              />
            </div>

            {/* Filter buttons */}
            <div className="flex gap-1 bg-white/90 backdrop-blur rounded-md p-1 shadow-lg">
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

          {/* Zoom controls */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2">
            <Button size="icon" variant="secondary" onClick={() => setZoom((z) => Math.min(z + 0.2, 2))}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="secondary" onClick={() => setZoom((z) => Math.max(z - 0.2, 0.5))}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="secondary" onClick={() => setZoom(1)}>
              <Locate className="w-4 h-4" />
            </Button>
          </div>
        </>
      )}

      {/* Selected Truck Popup */}
      {selectedTruck && (
        <Card className="absolute bottom-4 left-4 w-72 p-4 shadow-xl animate-in fade-in slide-in-from-bottom-2">
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-2 right-2 w-6 h-6"
            onClick={() => setSelectedTruck(null)}
          >
            <X className="w-4 h-4" />
          </Button>

          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${stateBgColors[selectedTruck.driver_state]}`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M18 18.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zM19.5 9.5l1.96 2.5H17V9.5h2.5zM6 18.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zM20 8l3 4v5h-2c0 1.66-1.34 3-3 3s-3-1.34-3-3H9c0 1.66-1.34 3-3 3s-3-1.34-3-3H1V6c0-1.11.89-2 2-2h14v4h3z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{selectedTruck.driver_name}</h3>
                <Badge className={stateBgColors[selectedTruck.driver_state]}>{selectedTruck.driver_state}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Driver #{selectedTruck.driver_id} • {selectedTruck.truck_id}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedTruck.lat.toFixed(4)}, {selectedTruck.long.toFixed(4)}
              </p>
            </div>
          </div>

          <Link href={`/drivers/${selectedTruck.driver_id}`}>
            <Button className="w-full mt-3" size="sm">
              View Driver Details
            </Button>
          </Link>
        </Card>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur rounded-lg px-4 py-2 shadow-lg flex gap-4 text-sm">
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
    </div>
  )
}

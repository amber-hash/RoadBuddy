"use client"

import { useState, useMemo } from "react"
import { useTruckStore } from "@/hooks/use-truck-store"
import { formatRelativeTime } from "@/lib/utils/time"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, ChevronRight, ArrowUpDown } from "lucide-react"
import Link from "next/link"
import type { DriverState } from "@/types/truck"

const stateBgColors: Record<DriverState, string> = {
  Normal: "bg-green-500",
  Drowsy: "bg-yellow-500 text-yellow-900",
  Asleep: "bg-red-500",
}

type SortKey = "status" | "name" | "updated"
type SortOrder = "asc" | "desc"

const statusOrder: Record<DriverState, number> = {
  Asleep: 0,
  Drowsy: 1,
  Normal: 2,
}

export function DriverTable() {
  const { trucks } = useTruckStore()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<DriverState | "all">("all")
  const [sortKey, setSortKey] = useState<SortKey>("status")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")

  const filteredAndSortedTrucks = useMemo(() => {
    let truckList = Array.from(trucks.values())

    // Filter by status
    if (statusFilter !== "all") {
      truckList = truckList.filter((t) => t.driver_state === statusFilter)
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase()
      truckList = truckList.filter(
        (t) =>
          t.driver_name.toLowerCase().includes(searchLower) ||
          t.truck_id.toLowerCase().includes(searchLower) ||
          t.driver_id.includes(searchLower),
      )
    }

    // Sort
    truckList.sort((a, b) => {
      let comparison = 0

      switch (sortKey) {
        case "status":
          comparison = statusOrder[a.driver_state] - statusOrder[b.driver_state]
          break
        case "name":
          comparison = a.driver_name.localeCompare(b.driver_name)
          break
        case "updated":
          comparison = new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime()
          break
      }

      return sortOrder === "asc" ? comparison : -comparison
    })

    return truckList
  }, [trucks, search, statusFilter, sortKey, sortOrder])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortOrder("asc")
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search driver name, ID, or truck..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Asleep">Asleep</SelectItem>
            <SelectItem value="Drowsy">Drowsy</SelectItem>
            <SelectItem value="Normal">Normal</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="status">Sort by Status</SelectItem>
            <SelectItem value="name">Sort by Name</SelectItem>
            <SelectItem value="updated">Sort by Updated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => toggleSort("name")}>
                  Driver
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Truck</TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => toggleSort("status")}>
                  Status
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Last Location</TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => toggleSort("updated")}>
                  Updated
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedTrucks.map((truck) => (
              <TableRow
                key={truck.truck_id}
                className={
                  truck.driver_state === "Asleep"
                    ? "bg-red-50 dark:bg-red-950/20"
                    : truck.driver_state === "Drowsy"
                      ? "bg-yellow-50 dark:bg-yellow-950/20"
                      : ""
                }
              >
                <TableCell>
                  <div>
                    <div className="font-medium">{truck.driver_name}</div>
                    <div className="text-sm text-muted-foreground">#{truck.driver_id}</div>
                  </div>
                </TableCell>
                <TableCell className="font-mono">{truck.truck_id}</TableCell>
                <TableCell>
                  <Badge className={stateBgColors[truck.driver_state]}>{truck.driver_state}</Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div className="font-mono text-xs">
                      {truck.lat.toFixed(4)}, {truck.long.toFixed(4)}
                    </div>
                    <div className="text-muted-foreground">Los Angeles Area</div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{formatRelativeTime(truck.lastUpdate)}</TableCell>
                <TableCell>
                  <Link href={`/drivers/${truck.driver_id}`}>
                    <Button variant="ghost" size="sm">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}

            {filteredAndSortedTrucks.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No drivers found matching your criteria
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Stats */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredAndSortedTrucks.length} of {trucks.size} drivers
      </div>
    </div>
  )
}

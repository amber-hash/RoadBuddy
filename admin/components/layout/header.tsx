"use client"

import { useTruckStore } from "@/hooks/use-truck-store"
import { formatRelativeTime } from "@/lib/utils/time"
import { Button } from "@/components/ui/button"
import { Truck, User, WifiOff } from "lucide-react"
import Link from "next/link"

export function Header() {
  const { connected, lastUpdate } = useTruckStore()

  return (
    <header className="h-16 border-b bg-background px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
          <Truck className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-semibold text-lg">Truck Fleet Monitoring</h1>
          <p className="text-xs text-muted-foreground">Real-time driver tracking</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Connection Status */}
        <div className="flex items-center gap-2 text-sm">
          {connected ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-green-600 font-medium">Live</span>
              </div>
              {lastUpdate && <span className="text-muted-foreground">• Updated {formatRelativeTime(lastUpdate)}</span>}
            </>
          ) : (
            <div className="flex items-center gap-1.5 text-red-600">
              <WifiOff className="w-4 h-4" />
              <span className="font-medium">Disconnected</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-2">
          <Link href="/">
            <Button variant="ghost" size="sm">
              Dashboard
            </Button>
          </Link>
          <Link href="/drivers">
            <Button variant="ghost" size="sm">
              All Drivers
            </Button>
          </Link>
        </nav>

        {/* Profile */}
        <Button variant="outline" size="icon">
          <User className="w-4 h-4" />
        </Button>
      </div>
    </header>
  )
}

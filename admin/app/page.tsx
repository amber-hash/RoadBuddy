"use client"

import dynamic from "next/dynamic"
import { TruckStoreProvider } from "@/hooks/use-truck-store"
import { Header } from "@/components/layout/header"
import { StatusBar } from "@/components/layout/status-bar"
import { NotificationPanel } from "@/components/notifications/notification-panel"

// Dynamically import the map component to avoid SSR issues with Leaflet
const TruckMapLeaflet = dynamic(
  () => import("@/components/map/truck-map-leaflet").then((mod) => mod.TruckMapLeaflet),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-slate-900 rounded-lg flex items-center justify-center">
        <p className="text-white">Loading map...</p>
      </div>
    )
  }
)

export default function DashboardPage() {
  return (
    <TruckStoreProvider>
      <div className="h-screen flex flex-col">
        <Header />

        <main className="flex-1 flex overflow-hidden">
          {/* Map - 70% */}
          <div className="flex-1 p-4">
            <TruckMapLeaflet className="h-full" />
          </div>

          {/* Notifications Panel - 30% */}
          <div className="w-[400px] flex-shrink-0">
            <NotificationPanel />
          </div>
        </main>

        <StatusBar />
      </div>
    </TruckStoreProvider>
  )
}

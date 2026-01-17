"use client"

import { TruckStoreProvider } from "@/hooks/use-truck-store"
import { Header } from "@/components/layout/header"
import { StatusBar } from "@/components/layout/status-bar"
import { TruckMap } from "@/components/map/truck-map"
import { NotificationPanel } from "@/components/notifications/notification-panel"

export default function DashboardPage() {
  return (
    <TruckStoreProvider>
      <div className="h-screen flex flex-col">
        <Header />

        <main className="flex-1 flex overflow-hidden">
          {/* Map - 70% */}
          <div className="flex-1 p-4">
            <TruckMap className="h-full" />
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

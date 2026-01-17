"use client"

import { TruckStoreProvider } from "@/hooks/use-truck-store"
import { Header } from "@/components/layout/header"
import { StatusBar } from "@/components/layout/status-bar"
import { DriverTable } from "@/components/drivers/driver-table"

export default function DriversPage() {
  return (
    <TruckStoreProvider>
      <div className="h-screen flex flex-col">
        <Header />

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">All Drivers</h1>
            <DriverTable />
          </div>
        </main>

        <StatusBar />
      </div>
    </TruckStoreProvider>
  )
}

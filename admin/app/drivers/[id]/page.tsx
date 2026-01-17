"use client"

import { use } from "react"
import { TruckStoreProvider } from "@/hooks/use-truck-store"
import { Header } from "@/components/layout/header"
import { StatusBar } from "@/components/layout/status-bar"
import { DriverDetail } from "@/components/drivers/driver-detail"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function DriverDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  return (
    <TruckStoreProvider>
      <div className="h-screen flex flex-col">
        <Header />

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-5xl mx-auto">
            <Link href="/drivers">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to All Drivers
              </Button>
            </Link>

            <DriverDetail driverId={id} />
          </div>
        </main>

        <StatusBar />
      </div>
    </TruckStoreProvider>
  )
}

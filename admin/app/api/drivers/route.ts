import { NextRequest, NextResponse } from "next/server"
import { getDrivers, getDriverById } from "../../../api/api"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (id) {
    const driver = await getDriverById(id)
    if (!driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 })
    }
    return NextResponse.json(driver)
  }

  const drivers = await getDrivers()
  return NextResponse.json(drivers)
}

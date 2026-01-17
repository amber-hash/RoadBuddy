import { NextRequest, NextResponse } from "next/server"
import { getDriverById } from "../../../../api/api"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  const driver = await getDriverById(id)
  
  if (!driver) {
    return NextResponse.json(
      { error: "Driver not found" },
      { status: 404 }
    )
  }

  return NextResponse.json(driver)
}

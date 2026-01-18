import { NextResponse } from "next/server"
import { emit } from "@/lib/sse"

export async function PUT(req: Request) {
  const { driver_id, state, lat, lon } = await req.json()

  if (!driver_id || !state || lat == null || lon == null) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  // 🔥 Emit immediately — no DB involved
  emit({
    type: "DRIVER_TELEMETRY",
    driver_id,
    state,
    location: { lat, lon },
    timestamp: Date.now()
  })

  return NextResponse.json({ ok: true })
}
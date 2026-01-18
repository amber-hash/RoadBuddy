import { NextResponse } from "next/server"
import { emit } from "@/lib/sse"

export async function OPTIONS(req: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}

export async function PUT(req: Request) {
  try {
    console.log("📥 [DRIVER] Received driver update request")
    console.log("📥 [DRIVER] URL:", req.url)
    console.log("📥 [DRIVER] Headers:", {
      "content-type": req.headers.get("content-type"),
      "user-agent": req.headers.get("user-agent"),
    })
    
    const body = await req.json()
    console.log("📥 [DRIVER] Body:", body)
    
    const { driver_id, state, lat, lon } = body

    if (!driver_id || !state || lat == null || lon == null) {
      console.error("❌ [DRIVER] Invalid payload:", { driver_id, state, lat, lon })
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    console.log("✅ [DRIVER] Valid payload received")
    
    // 🔥 Emit immediately — no DB involved
    emit({
      type: "DRIVER_TELEMETRY",
      driver_id,
      state,
      location: { lat, lon },
      timestamp: Date.now()
    })

    console.log("✅ [DRIVER] Event emitted successfully")
    return new NextResponse(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (error) {
    console.error("❌ [DRIVER] Error:", error)
    return new NextResponse(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    )
  }
}
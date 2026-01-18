import { addClient, removeClient } from "@/lib/sse"

export const maxDuration = 60; // 60 seconds max for Vercel Pro
export const runtime = "edge";
export async function GET() {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      addClient(controller)
      
      // Send initial confirmation
      try {
        controller.enqueue(encoder.encode(":ok\n\n"))
      } catch (e) {
        removeClient(controller)
        return
      }

      // Send heartbeat every 10 seconds to keep connection alive and prevent Vercel timeout
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`:heartbeat\n\n`))
        } catch (error) {
          console.error("Heartbeat error:", error)
          clearInterval(heartbeat)
          removeClient(controller)
        }
      }, 10000)

      // Store interval for cleanup
      ;(controller as any).__heartbeat = heartbeat

      // Auto-close after 55 seconds (leave 5s buffer before Vercel timeout)
      const closeTimer = setTimeout(() => {
        console.log("SSE connection auto-closing after 55s (Vercel timeout prevention)")
        try {
          controller.enqueue(encoder.encode(":closing\n\n"))
        } catch (e) {
          // Already closed
        }
        clearInterval(heartbeat)
        clearTimeout(closeTimer)
        removeClient(controller)
        try {
          controller.close()
        } catch (e) {
          // Already closed
        }
      }, 55000)

      ;(controller as any).__closeTimer = closeTimer
    },
    cancel(controller) {
      const heartbeat = (controller as any).__heartbeat
      const closeTimer = (controller as any).__closeTimer
      if (heartbeat) clearInterval(heartbeat)
      if (closeTimer) clearTimeout(closeTimer)
      removeClient(controller)
    }
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "X-Accel-Buffering": "no" // Disable buffering for streaming
    }
  })
}
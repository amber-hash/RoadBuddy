import { addClient, removeClient } from "@/lib/sse"

export async function GET() {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      addClient(controller)
      controller.enqueue(encoder.encode(":ok\n\n"))

      // Send heartbeat every 15 seconds to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(":heartbeat\n\n"))
        } catch {
          clearInterval(heartbeat)
          removeClient(controller)
        }
      }, 15000)

      // Store interval for cleanup
      ;(controller as any).__heartbeat = heartbeat
    },
    cancel(controller) {
      const heartbeat = (controller as any).__heartbeat
      if (heartbeat) clearInterval(heartbeat)
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
      "Access-Control-Allow-Headers": "Content-Type"
    }
  })
}
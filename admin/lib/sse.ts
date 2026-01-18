type Client = ReadableStreamDefaultController

const clients = new Set<Client>()

export function addClient(controller: Client) {
  clients.add(controller)
  console.log(`[SSE] Client connected. Total clients: ${clients.size}`)
}

export function removeClient(controller: Client) {
  clients.delete(controller)
  console.log(`[SSE] Client disconnected. Total clients: ${clients.size}`)
}

export function emit(event: any) {
  console.log(`[SSE] Emitting to ${clients.size} clients:`, event)
  const message = `data: ${JSON.stringify(event)}\n\n`
  const encoder = new TextEncoder()
  const data = encoder.encode(message)

  clients.forEach(controller => {
    try {
      controller.enqueue(data)
    } catch (error) {
      console.error('[SSE] Failed to enqueue message:', error)
      clients.delete(controller)
    }
  })
}
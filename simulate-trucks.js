#!/usr/bin/env node

/**
 * Truck Fleet Simulator
 * Continuously sends telemetry updates for 4 trucks with random movements and state changes
 */

const API_URL = 'http://localhost:3000/api/drivers/driver'

// Los Angeles center coordinates
const LA_CENTER = { lat: 34.0522, lon: -118.2437 }

// Truck configurations
const trucks = [
  { id: '101', name: 'Alice Johnson', state: 'Normal', lat: 34.0522, lon: -118.2437 },
  { id: '102', name: 'Bob Smith', state: 'Normal', lat: 34.0722, lon: -118.2937 },
  { id: '103', name: 'Carol Williams', state: 'Normal', lat: 34.1122, lon: -118.3437 },
  { id: '104', name: 'David Brown', state: 'Normal', lat: 34.0422, lon: -118.1937 }
]

const states = ['Normal', 'Normal', 'Normal', 'Drowsy', 'Asleep'] // More likely to be Normal

// Random movement delta (small steps for realistic movement)
function getRandomMovement() {
  return (Math.random() - 0.5) * 0.005 // ~0.5km movement
}

// Randomly change state (but not too frequently)
function maybeChangeState(currentState) {
  if (Math.random() < 0.15) { // 15% chance to change state
    return states[Math.floor(Math.random() * states.length)]
  }
  return currentState
}

// Send update to the API
async function sendUpdate(truck) {
  try {
    const response = await fetch(API_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        driver_id: truck.id,
        state: truck.state,
        lat: truck.lat,
        lon: truck.lon
      })
    })

    const result = await response.json()
    const timestamp = new Date().toLocaleTimeString()
    const stateEmoji = truck.state === 'Normal' ? '🟢' : truck.state === 'Drowsy' ? '🟡' : '🔴'

    console.log(`[${timestamp}] ${stateEmoji} Truck ${truck.id} (${truck.name}): ${truck.state} @ (${truck.lat.toFixed(4)}, ${truck.lon.toFixed(4)})`)

    return result
  } catch (error) {
    console.error(`❌ Error updating truck ${truck.id}:`, error.message)
  }
}

// Update a single truck
function updateTruck(truck) {
  // Move the truck
  truck.lat += getRandomMovement()
  truck.lon += getRandomMovement()

  // Keep trucks within LA area bounds
  truck.lat = Math.max(33.9, Math.min(34.2, truck.lat))
  truck.lon = Math.max(-118.5, Math.min(-118.0, truck.lon))

  // Maybe change state
  truck.state = maybeChangeState(truck.state)

  // Send update
  return sendUpdate(truck)
}

// Main simulation loop
async function simulate() {
  console.log('🚛 Starting Truck Fleet Simulator...')
  console.log('📍 Simulating 4 trucks around Los Angeles')
  console.log('⏱️  Sending updates every 2 seconds')
  console.log('🛑 Press Ctrl+C to stop\n')

  // Send initial positions
  for (const truck of trucks) {
    await sendUpdate(truck)
  }

  // Continuous updates
  setInterval(async () => {
    for (const truck of trucks) {
      await updateTruck(truck)
    }
    console.log('---')
  }, 2000) // Update every 2 seconds
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Stopping simulation...')
  process.exit(0)
})

// Start the simulation
simulate()

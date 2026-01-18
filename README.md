# 🚛 RoadBuddy

**Real-time truck fleet monitoring and driver safety system with AI-powered drowsiness detection**

RoadBuddy is a comprehensive safety platform that combines real-time fleet tracking, AI-driven drowsiness detection, and intelligent driver engagement to prevent accidents before they happen.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Mobile Apps](#mobile-apps)
- [Environment Variables](#environment-variables)
- [How It Works](#how-it-works)
- [Screenshots](#screenshots)

---

## 🎯 Overview

RoadBuddy monitors truck drivers in real-time and proactively intervenes when drowsiness is detected. The system includes:

- **Admin Dashboard**: Web-based fleet monitoring with live maps and alerts
- **iOS Mobile App**: Camera-based drowsiness detection using SmartSpectra SDK
- **AI Safety Assistant**: Natural conversation system to keep drowsy drivers alert
- **Emergency Protocol**: Automatic alerts when drivers fall asleep

### Driver States

- 🟢 **Normal**: Safe driving conditions
- 🟡 **Drowsy**: Warning state - AI initiates conversation
- 🔴 **Asleep**: Emergency - loud alarm + 911 notification

---

## ✨ Features

### Real-Time Fleet Monitoring
- Live truck locations on interactive Leaflet maps
- Color-coded driver state indicators
- Animated alerts for non-normal states
- Automatic map bounds adjustment
- Search and filter capabilities

### AI-Powered Safety Conversations
- **Google Gemini 2.5 Flash**: Generates contextual, engaging responses
- **ElevenLabs Text-to-Speech**: Natural voice alerts
- Auto-starts conversation when drowsiness detected
- Short, engaging questions to maintain alertness
- Suggests safe actions (pull over, take breaks, etc.)

### Smart Notification System
- Real-time alerts panel
- Categorized by severity (Critical/Warnings)
- Acknowledgment tracking
- Location & driver details
- Persistent notification history

### Driver Management
- All drivers table with search/sort/filter
- Individual driver detail pages
- Status history timeline
- Statistics tracking (hours driven, incidents, distance)
- Contact functionality (call/alert buttons)

### Emergency Protocol
When a driver falls asleep:
1. Plays loud alarm sound (5 seconds)
2. Displays "911 has been called" message
3. Triggers critical alert in notification panel
4. Returns special `isEmergency` flag to clients

---

## 🛠 Tech Stack

### Admin Dashboard
- **Framework**: Next.js 16.0.10 (App Router)
- **Language**: TypeScript 5+
- **UI**: React 19.2.0, Tailwind CSS 4.1.9
- **Components**: Radix UI (20+ primitives)
- **Maps**: Leaflet & react-leaflet 5.0.0
- **Charts**: Recharts 2.15.4
- **Forms**: React Hook Form 7.60.0
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js (Next.js API routes)
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Server-Sent Events (SSE)
- **AI**: Google Generative AI (Gemini 2.5 Flash)
- **TTS**: ElevenLabs (eleven_multilingual_v2)

### Mobile
- **iOS**: SwiftUI + SmartSpectraSwiftSDK
- **Android**: In development (Gradle-based)

### DevTools
- pnpm (package manager)
- ESLint
- Vercel Analytics

---

## 📁 Project Structure

```
RoadBuddy/
├── admin/                          # Next.js admin dashboard
│   ├── app/
│   │   ├── api/
│   │   │   ├── drivers/
│   │   │   │   ├── route.ts        # GET all drivers
│   │   │   │   ├── [id]/route.ts   # GET single driver
│   │   │   │   ├── driver/route.ts # PUT update telemetry
│   │   │   │   └── sse/route.ts    # Server-Sent Events stream
│   │   │   ├── chat/route.ts       # POST AI conversation
│   │   │   └── play/route.js       # GET audio playback
│   │   ├── page.tsx                # Dashboard (map + notifications)
│   │   ├── drivers/
│   │   │   ├── page.tsx            # All drivers table
│   │   │   └── [id]/page.tsx       # Driver detail page
│   │   └── layout.tsx              # Root layout
│   ├── components/
│   │   ├── map/
│   │   │   └── truck-map-leaflet.tsx  # Interactive map
│   │   ├── drivers/
│   │   │   ├── driver-table.tsx    # Sortable table
│   │   │   └── driver-detail.tsx   # Detail view
│   │   ├── notifications/
│   │   │   ├── notification-panel.tsx
│   │   │   └── alert-card.tsx
│   │   └── ui/                     # Radix UI components
│   ├── hooks/
│   │   ├── use-truck-store.tsx     # Global state (Context)
│   │   └── use-sse.ts              # SSE hook
│   ├── lib/
│   │   ├── supabase/client.ts      # Database client
│   │   └── sse.ts                  # SSE utilities
│   ├── types/truck.ts              # TypeScript types
│   ├── api/api.ts                  # Supabase queries
│   └── public/sounds/              # Audio files (alarm.mp3)
│
├── roadbuddy/                      # iOS app (SwiftUI)
│   └── roadbuddy/
│       ├── roadbuddyApp.swift      # App entry
│       ├── ContentView.swift       # Main view
│       └── Secrets.swift           # API keys
│
├── android/                        # Android app (in development)
│
├── simulate-trucks.js              # Fleet simulator (4 trucks)
└── README.md                       # This file
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Supabase account
- Google Gemini API key
- ElevenLabs API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/amber-hash/RoadBuddy.git
   cd RoadBuddy
   ```

2. **Install dependencies**
   ```bash
   cd admin
   pnpm install
   ```

3. **Set up environment variables**

   Create `admin/.env` with the following:
   ```env
   # ElevenLabs (Text-to-Speech)
   ELEVENLABS_API_KEY=your_elevenlabs_api_key
   ELEVENLABS_VOICE_ID=9meO3bnUkQIW7fL6nLmH

   # Google Gemini
   GEMINI_API_KEY=your_gemini_api_key

   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_key
   ```

4. **Run development server**
   ```bash
   pnpm dev
   ```
   Dashboard will be available at [http://localhost:3000](http://localhost:3000)

5. **Run fleet simulator** (in a separate terminal)
   ```bash
   node simulate-trucks.js
   ```
   This simulates 4 trucks driving around Los Angeles with realistic state changes.

### Database Setup

Create a `drivers` table in Supabase:

```sql
CREATE TABLE drivers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  vehicle_id TEXT UNIQUE NOT NULL,
  state TEXT DEFAULT 'Normal',
  lat REAL,
  lon REAL,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📡 API Documentation

### Driver Management

#### GET `/api/drivers`
Fetch all drivers from database.

**Response:**
```json
[
  {
    "name": "Alice Johnson",
    "vehicle_id": "101",
    "state": "Normal"
  }
]
```

#### GET `/api/drivers/[id]`
Fetch specific driver by ID.

**Response:**
```json
{
  "name": "Alice Johnson",
  "vehicle_id": "101",
  "state": "Drowsy",
  "lat": 34.0522,
  "lon": -118.2437
}
```

#### PUT `/api/drivers/driver`
Update driver telemetry (location + state).

**Request:**
```json
{
  "driver_id": "101",
  "state": "Drowsy",
  "lat": 34.0522,
  "lon": -118.2437
}
```

**Response:**
```json
{ "ok": true }
```

Automatically broadcasts to all SSE clients.

---

### Real-Time Updates

#### GET `/api/drivers/sse`
Establish Server-Sent Events connection for live updates.

**Response Type:** `text/event-stream`

**Message Format:**
```json
{
  "type": "DRIVER_TELEMETRY",
  "driver_id": "101",
  "state": "Drowsy",
  "location": { "lat": 34.0522, "lon": -118.2437 },
  "timestamp": 1737150456789
}
```

**Features:**
- Persistent connection
- 15-second heartbeat
- Immediate broadcasting
- Auto-reconnect on disconnect

---

### AI Safety Chat

#### POST `/api/chat`
Generate AI responses for driver safety conversations.

**Request:**
```json
{
  "message": "I'm really tired",
  "driverState": "drowsy",
  "conversationHistory": []
}
```

**Response:**
```json
{
  "reply": "I hear you! Pull over at the next rest stop for a quick break?",
  "audioUrl": "/api/play?file=reply-1737150456789.mp3"
}
```

**Special Behaviors:**
- **Empty message + "drowsy"**: Auto-starts engagement conversation
- **"asleep" state**: Triggers emergency protocol
  ```json
  {
    "reply": "EMERGENCY: Driver asleep! Alarm activated and 911 has been called.",
    "audioUrl": "/api/play?file=alarm-1737150456789.mp3",
    "driverState": "emergency",
    "isEmergency": true,
    "nineOneOneCalled": true
  }
  ```

**AI Prompts:**

*Drowsy State:*
```
You are RoadBuddy, an AI safety assistant for truck drivers.
The driver is showing signs of DROWSINESS.
Keep responses SHORT (1-2 sentences max).
Use engaging, open-ended questions.
Suggest safe actions (pull over, break, coffee).
Act like a concerned friend, not a robot.
```

*Normal State:*
```
You are RoadBuddy, a friendly AI companion for truck drivers.
Have natural, engaging conversation.
Keep responses SHORT (1-2 sentences max).
```

---

### Audio Playback

#### GET `/api/play?file=[filename]`
Stream audio files (AI responses or alarm sounds).

**Response Type:** `audio/mpeg`

**Example:**
```
GET /api/play?file=reply-1737150456789.mp3
```

---

## 📱 Mobile Apps

### iOS App

**Technology:**
- SwiftUI
- SmartSpectraSwiftSDK (drowsiness detection)
- AVPlayer (audio playback)

**Key Files:**
- [roadbuddyApp.swift](roadbuddy/roadbuddy/roadbuddyApp.swift) - App entry point
- [ContentView.swift](roadbuddy/roadbuddy/ContentView.swift) - SmartSpectraView integration
- [Secrets.swift](roadbuddy/roadbuddy/Secrets.swift) - API keys

**Features:**
- Camera-based drowsiness detection
- Real-time facial analysis
- Eye closure monitoring
- Automatic backend integration
- Voice response playback

**Setup:**
1. Open `roadbuddy/roadbuddy.xcodeproj` in Xcode
2. Update `Secrets.swift` with your SmartSpectrum API key
3. Build and run on iOS device or simulator

### Android App

Currently in scaffolding phase. Gradle-based project structure in place.

---

## 🔐 Environment Variables

Create `admin/.env` with these variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `ELEVENLABS_API_KEY` | ElevenLabs API key for TTS | `sk_848b50...` |
| `ELEVENLABS_VOICE_ID` | Voice ID for TTS (optional) | `9meO3bnUkQIW7fL6nLmH` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIzaSyBgm...` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co/` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Supabase public key | `sb_publishable_...` |

**Getting API Keys:**
- ElevenLabs: [elevenlabs.io](https://elevenlabs.io/)
- Google Gemini: [ai.google.dev](https://ai.google.dev/)
- Supabase: [supabase.com](https://supabase.com/)

---

## ⚙️ How It Works

### 1. Drowsiness Detection (iOS App)

The iOS app uses SmartSpectraSwiftSDK to analyze the driver's face in real-time:
- Eye closure duration
- Blink frequency
- Head position
- Facial landmarks

When drowsiness is detected, the app sends the state to the backend.

### 2. State Broadcasting (Backend)

When telemetry is updated via `PUT /api/drivers/driver`:
1. Updates Supabase database
2. Broadcasts to all SSE clients via `emit()`
3. Clients receive instant updates

### 3. AI Intervention (Drowsy State)

When driver becomes drowsy:
1. Backend auto-starts conversation (empty message triggers)
2. Gemini generates engaging question
3. ElevenLabs converts to natural speech
4. Audio plays in app to keep driver alert
5. Driver responds via voice
6. Conversation continues until state improves

### 4. Emergency Protocol (Asleep State)

When driver falls asleep:
1. Backend returns alarm audio instead of TTS
2. Loud alarm plays for 5 seconds
3. "911 has been called" message displayed
4. Critical alert appears in dashboard
5. Fleet managers notified immediately

### 5. Fleet Simulator

`simulate-trucks.js` creates realistic test data:
- 4 trucks around Los Angeles
- Random movement (~0.5km per update)
- 15% chance of state change
- 2-second update interval
- Emoji-coded console output (🟢🟡🔴)

---

## 📊 Fleet Simulator

The simulator creates 4 trucks with realistic behavior:

```bash
node simulate-trucks.js
```

**Simulated Drivers:**
- Alice Johnson (Truck 101)
- Bob Smith (Truck 102)
- Carol Williams (Truck 103)
- Dave Martinez (Truck 104)

**Behavior:**
- Start in Los Angeles area
- Random movement (±0.005° lat/lon ≈ 0.5km)
- State changes: 15% probability per update
- Updates every 2 seconds
- Console output with emoji indicators

**Example Output:**
```
🟢 Truck 101 [Alice Johnson] - Normal @ (34.0522, -118.2437)
🟡 Truck 102 [Bob Smith] - Drowsy @ (34.0523, -118.2440)
🔴 Truck 103 [Carol Williams] - Asleep @ (34.0521, -118.2435)
```

---

## 🎨 Screenshots

### Dashboard
- 70% interactive map with live truck markers
- 30% notification panel with real-time alerts
- Color-coded driver states
- Animated ping effects on alerts

### Driver Detail Page
- Status history timeline
- Location map
- Statistics (hours driven, drowsy incidents, distance)
- Contact buttons (call/alert)

### All Drivers Table
- Searchable and sortable
- Color-coded status badges
- Quick actions (view details, contact)
- Filter by state

---

## 🏗 Architecture Highlights

### Real-Time Communication
- **Server-Sent Events (SSE)**: Persistent connections for live updates
- **Zero Database Latency**: Broadcasts bypass database reads
- **Heartbeat System**: 15-second keepalive prevents timeouts
- **Auto-Reconnect**: Clients automatically reconnect on disconnect

### State Management
- **React Context**: Global state for trucks and notifications
- **SSE Hook**: Custom hook for event stream management
- **Optimistic Updates**: UI updates immediately on actions
- **Notification Persistence**: Last 100 notifications kept

### AI Integration
- **Gemini 2.5 Flash**: Fast, context-aware responses
- **State-Specific Prompts**: Different behavior for Normal/Drowsy/Asleep
- **Conversation History**: Maintains context across exchanges
- **Short Responses**: 1-2 sentences for safety (driver attention)

### Emergency Handling
- **Alarm Priority**: Pre-recorded alarm instead of TTS
- **Immediate Broadcast**: No delays on critical alerts
- **Multi-Channel Notification**: Dashboard + Mobile + (Future: SMS)

---

## 🔮 Future Enhancements

- [ ] Android app with drowsiness detection
- [ ] SMS/Phone call integration for emergencies
- [ ] Route optimization and ETA predictions
- [ ] Driver fatigue scoring algorithm
- [ ] Historical analytics dashboard
- [ ] Multi-fleet support
- [ ] Geofencing and route compliance
- [ ] Integration with truck telemetry (speed, braking, etc.)

---

## 🤝 Contributing

This is a hackathon project. Contributions, issues, and feature requests are welcome!

---

## 📄 License

This project was created for a hackathon. License TBD.

---

## 👥 Team

Built with ❤️ by the RoadBuddy team

---

## 📞 Support

For questions or issues, please open an issue on GitHub.

---

**Stay safe on the road with RoadBuddy! 🚛💙**

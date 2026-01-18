# Drowsiness Detection Integration Guide

## 🎯 Overview

The `/api/chat` endpoint now automatically initiates conversations when drowsiness is detected, using specialized prompt engineering to keep drivers alert and safe.

---

## 🚗 How It Works

### **Auto-Start Conversation (Drowsiness Detected)**

When your frontend detects drowsiness, send an empty or minimal request:

```json
{
  "message": "",
  "driverState": "drowsy"
}
```

**What happens:**
1. Backend detects `driverState: "drowsy"` with empty message
2. Automatically triggers special drowsiness prompt
3. Gemini generates an engaging opening like:
   - "Hey, I noticed you're looking a bit drowsy. How are you feeling right now?"
   - "Buddy, you seem tired! When's the last time you took a break?"
4. ElevenLabs converts to speech
5. Returns audio URL to play immediately

---

## 📱 Swift Integration Examples

### **Option 1: Auto-Start on Drowsiness Detection**

```swift
import Foundation
import AVFoundation

class DrowsinessMonitor {
    var audioPlayer: AVPlayer?

    // Call this when your ML model detects drowsiness
    func onDrowsinessDetected() {
        print("⚠️ Drowsiness detected! Starting conversation...")
        startDrowsinessConversation()
    }

    func startDrowsinessConversation() {
        guard let url = URL(string: "http://YOUR_SERVER:3000/api/chat") else { return }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        // Empty message triggers auto-start
        let body: [String: Any] = [
            "message": "",
            "driverState": "drowsy"
        ]

        request.httpBody = try? JSONSerialization.data(withJSONObject: body)

        URLSession.shared.dataTask(with: request) { data, response, error in
            guard let data = data, error == nil else {
                print("Error: \(error?.localizedDescription ?? "Unknown")")
                return
            }

            if let json = try? JSONDecoder().decode(ChatResponse.self, from: data) {
                print("🤖 AI says: \(json.reply)")

                // Play the audio immediately
                self.playAudio(audioUrl: "http://YOUR_SERVER:3000\(json.audioUrl)")
            }
        }.resume()
    }

    func playAudio(audioUrl: String) {
        guard let url = URL(string: audioUrl) else { return }

        DispatchQueue.main.async {
            let playerItem = AVPlayerItem(url: url)
            self.audioPlayer = AVPlayer(playerItem: playerItem)
            self.audioPlayer?.play()
        }
    }
}

struct ChatResponse: Codable {
    let reply: String
    let audioUrl: String
}
```

### **Option 2: Continuous Conversation Loop**

```swift
class ConversationManager {
    var isDrowsy = false
    var conversationActive = false

    // When drowsiness is detected
    func handleDrowsinessDetection() {
        guard !conversationActive else { return }

        isDrowsy = true
        conversationActive = true

        // Start the conversation
        sendMessage("", driverState: "drowsy")
    }

    // When driver responds (via voice input)
    func onDriverResponse(_ text: String) {
        if isDrowsy {
            sendMessage(text, driverState: "drowsy")
        }
    }

    // When alertness is restored
    func onAlertRestored() {
        isDrowsy = false
        conversationActive = false
        print("✅ Driver is alert again")
    }

    func sendMessage(_ message: String, driverState: String) {
        guard let url = URL(string: "http://YOUR_SERVER:3000/api/chat") else { return }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body: [String: Any] = [
            "message": message,
            "driverState": driverState
        ]

        request.httpBody = try? JSONSerialization.data(withJSONObject: body)

        URLSession.shared.dataTask(with: request) { data, response, error in
            guard let data = data else { return }

            if let json = try? JSONDecoder().decode(ChatResponse.self, from: data) {
                // Play audio response
                self.playAudio(audioUrl: "http://YOUR_SERVER:3000\(json.audioUrl)")
            }
        }.resume()
    }
}
```

---

## 🧠 Prompt Engineering Examples

### **Initial Auto-Generated Responses**

When you send `{ "message": "", "driverState": "drowsy" }`, Gemini might say:

**Example 1:**
> "Hey there! I noticed you're looking a bit drowsy. How long have you been driving today?"

**Example 2:**
> "Buddy, you seem tired! What's keeping you going right now? Music? Coffee?"

**Example 3:**
> "I can see you're fighting to stay awake. When did you last take a real break?"

### **Follow-Up Conversation**

**Driver:** "I'm fine, just a bit tired"
**Gemini:** "I hear you, but 'a bit tired' can turn into dangerous real quick. There's a rest stop 3 miles ahead - what do you say we pull over for 15 minutes?"

**Driver:** "Maybe I should stop"
**Gemini:** "That's the smart move! Your safety is everything. Pull over safely when you can, and grab a quick power nap or stretch your legs."

---

## 📊 Request/Response Examples

### **Test 1: Auto-Start Drowsiness Conversation**

**Request:**
```json
POST http://localhost:3000/api/chat
{
  "message": "",
  "driverState": "drowsy"
}
```

**Response:**
```json
{
  "reply": "Hey, I noticed you're getting a bit drowsy there. How are you holding up? Want to talk about what's on your mind?",
  "audioUrl": "/api/play?file=reply-1737150456789.mp3"
}
```

### **Test 2: Driver Responds**

**Request:**
```json
{
  "message": "Yeah, I'm just really tired",
  "driverState": "drowsy"
}
```

**Response:**
```json
{
  "reply": "I totally get it - long hauls are exhausting! But your safety matters. How about pulling over at the next rest stop for a quick 20-minute nap?",
  "audioUrl": "/api/play?file=reply-1737150789123.mp3"
}
```

### **Test 3: Normal Conversation (Not Drowsy)**

**Request:**
```json
{
  "message": "What's the weather like ahead?",
  "driverState": "alert"
}
```

**Response:**
```json
{
  "reply": "I don't have real-time weather data, but I can chat with you about your route! Where are you headed?",
  "audioUrl": "/api/play?file=reply-1737151234567.mp3"
}
```

---

## 🧪 Testing

### **Test Auto-Start:**
```bash
cd admin
node test-drowsy-auto-start.js
```

### **Test with Postman/Insomnia:**
```
POST http://localhost:3000/api/chat
Content-Type: application/json

{
  "message": "",
  "driverState": "drowsy"
}
```

### **Test with curl:**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"","driverState":"drowsy"}'
```

---

## ✅ Integration Checklist

- [ ] Frontend detects drowsiness (camera/ML model)
- [ ] Send POST to `/api/chat` with empty message + `driverState: "drowsy"`
- [ ] Receive audio URL in response
- [ ] Play audio immediately using AVPlayer
- [ ] Enable speech-to-text for driver responses
- [ ] Send driver responses back to `/api/chat` with `driverState: "drowsy"`
- [ ] Continue conversation loop
- [ ] Stop conversation when alertness is restored

---

## 🚀 Production Considerations

1. **Voice Detection**: Integrate speech-to-text (Apple Speech Framework) for driver responses
2. **Continuous Monitoring**: Keep checking drowsiness state every few seconds
3. **Escalation**: If drowsiness persists after 2-3 exchanges, strongly recommend stopping
4. **Emergency Actions**: Consider triggering emergency contacts if no response
5. **Audio Priority**: Make sure RoadBuddy audio interrupts music/podcasts

---

## 🎉 You're All Set!

The endpoint is ready to automatically engage drowsy drivers in conversation. Just send an empty message with `driverState: "drowsy"` and let Gemini do the rest!

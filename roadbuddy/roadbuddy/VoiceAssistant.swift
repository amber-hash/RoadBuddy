import Foundation
import Speech
import AVFoundation
import Combine

class VoiceAssistant: NSObject, ObservableObject, AVAudioPlayerDelegate {
    @Published var isListening = false
    @Published var isSpeaking = false
    @Published var conversationActive = false
    @Published var lastTranscript = ""
    
    private var audioPlayer: AVAudioPlayer?
    private let speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private let audioEngine = AVAudioEngine()
    private let audioSession = AVAudioSession.sharedInstance()
    
    private var conversationTimer: Timer?
    private var drowsySessionActive = false
    private var conversationStartTime: Date?
    private let conversationDuration: TimeInterval = 60 // 1 minute per session
    
    private let networkManager = NetworkManager.shared
    private var currentDriverState = "Normal"
    
    override init() {
        super.init()
        print("🔧 [INIT] VoiceAssistant initializing...")
        setupAudioSession()
        requestMicrophonePermission()
        requestSpeechPermission()
        print("✅ [INIT] VoiceAssistant initialized")
    }
    
    // MARK: - Audio Session Setup
    private func setupAudioSession() {
        print("🔧 [AUDIO] Setting up audio session...")
        do {
            try audioSession.setCategory(.playAndRecord, options: [.duckOthers])
            try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
            print("✅ [AUDIO] Audio session configured for playback and recording")
        } catch {
            print("❌ [AUDIO] Audio session error: \(error)")
        }
    }
    
    // MARK: - Permissions
    private func requestMicrophonePermission() {
        print("🔧 [PERMISSIONS] Requesting microphone permission...")
        AVAudioApplication.requestRecordPermission { granted in
            DispatchQueue.main.async {
                if granted {
                    print("✅ [PERMISSIONS] Microphone permission granted")
                } else {
                    print("❌ [PERMISSIONS] Microphone permission denied")
                }
            }
        }
    }
    
    private func requestSpeechPermission() {
        print("🔧 [PERMISSIONS] Requesting speech recognition permission...")
        SFSpeechRecognizer.requestAuthorization { status in
            DispatchQueue.main.async {
                switch status {
                case .authorized:
                    print("✅ [PERMISSIONS] Speech recognition authorized")
                case .denied:
                    print("❌ [PERMISSIONS] Speech recognition denied")
                case .restricted:
                    print("⚠️ [PERMISSIONS] Speech recognition restricted")
                case .notDetermined:
                    print("⚠️ [PERMISSIONS] Speech recognition not determined")
                @unknown default:
                    print("⚠️ [PERMISSIONS] Speech recognition unknown status")
                }
            }
        }
    }
    
    // MARK: - Drowsy Conversation Session
    /// Start a 1-minute drowsy conversation session
    func startDrowsyConversation(driverState: String) {
        guard !drowsySessionActive else {
            print("⚠️ [DROWSY] Drowsy conversation already active")
            return
        }
        
        print("🚨 [DROWSY] ====== DROWSY CONVERSATION STARTED ======")
        print("🚨 [DROWSY] Driver State: \(driverState)")
        print("🚨 [DROWSY] Conversation Duration: \(conversationDuration)s")
        drowsySessionActive = true
        conversationActive = true
        conversationStartTime = Date()
        currentDriverState = driverState
        
        // Request first AI response
        print("🚨 [DROWSY] Requesting initial AI response...")
        requestChatResponse(message: nil, driverState: driverState)
        
        // Start timer to check if conversation should continue after 1 minute
        startConversationTimer()
    }
    
    private func startConversationTimer() {
        conversationTimer?.invalidate()
        print("⏱️ [TIMER] Setting up \(conversationDuration)s timer")
        conversationTimer = Timer.scheduledTimer(withTimeInterval: conversationDuration, repeats: false) { [weak self] _ in
            print("⏱️ [TIMER] Timer fired - checking if driver still drowsy")
            self?.checkAndContinueConversation()
        }
    }
    
    private func checkAndContinueConversation() {
        print("⏱️ [TIMER] Conversation minute elapsed. Checking if driver still drowsy...")
        print("⏱️ [TIMER] Current driver state: \(currentDriverState)")
        
        // If the driver is no longer drowsy, end session
        if currentDriverState.lowercased() != "drowsy" {
            print("✅ [DROWSY] Driver no longer drowsy. Ending conversation.")
            endDrowsyConversation()
            return
        }
        
        // Continue for another minute
        print("⚠️ [DROWSY] Driver still drowsy. Continuing conversation for another minute...")
        conversationStartTime = Date()
        requestChatResponse(message: nil, driverState: "Drowsy")
        startConversationTimer()
    }
    
    func endDrowsyConversation() {
        print("🛑 [DROWSY] ====== DROWSY CONVERSATION ENDED ======")
        drowsySessionActive = false
        conversationActive = false
        conversationTimer?.invalidate()
        conversationTimer = nil
        stopListening()
    }
    
    // MARK: - Chat API
    private func requestChatResponse(message: String?, driverState: String) {
        let displayMessage = message ?? "(auto-initiated)"
        print("📤 [API] Sending chat request:")
        print("📤 [API]   Message: \(displayMessage)")
        print("📤 [API]   Driver State: \(driverState)")
        
        let payload: [String: Any] = [
            "message": message ?? "",
            "driverState": driverState
        ]
        
        guard let url = URL(string: "http://10.206.38.172:3000/api/chat") else {
            print("❌ [API] Invalid chat URL")
            return
        }
        
        print("📤 [API] URL: \(url)")
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: payload)
            print("📤 [API] Request body prepared")
            
            URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
                if let error = error {
                    print("❌ [API] Chat request error: \(error.localizedDescription)")
                    return
                }
                
                // Log HTTP response status
                if let httpResponse = response as? HTTPURLResponse {
                    print("� [API] HTTP Status: \(httpResponse.statusCode)")
                }
                
                guard let data = data else {
                    print("❌ [API] No data from chat endpoint")
                    return
                }
                
                print("📥 [API] Received \(data.count) bytes")
                
                // Log the raw response for debugging
                if let jsonString = String(data: data, encoding: .utf8) {
                    print("� [API] Raw response:\n\(jsonString)")
                }
                
                do {
                    let result = try JSONDecoder().decode(ChatResponse.self, from: data)
                    print("✅ [API] Successfully decoded chat response")
                    print("✅ [API] Reply: \(result.reply)")
                    print("✅ [API] Audio URL: \(result.audioUrl)")
                    DispatchQueue.main.async {
                        self?.playAudio(from: result.audioUrl)
                    }
                } catch {
                    print("❌ [API] Failed to decode chat response: \(error)")
                    // Try to parse as error response
                    if let errorResponse = try? JSONDecoder().decode([String: String].self, from: data) {
                        print("❌ [API] Error response from server: \(errorResponse)")
                    }
                }
            }.resume()
        } catch {
            print("❌ [API] Failed to encode chat request: \(error)")
        }
    }
    
    // MARK: - Audio Playback
    private func playAudio(from audioUrl: String) {
        guard let fullUrl = URL(string: "http://10.206.38.172:3000\(audioUrl)") else {
            print("❌ [AUDIO] Invalid audio URL: \(audioUrl)")
            return
        }
        
        print("🔊 [AUDIO] Fetching audio from: \(fullUrl)")
        
        URLSession.shared.dataTask(with: fullUrl) { [weak self] data, response, error in
            guard let self = self, let data = data, error == nil else {
                print("❌ [AUDIO] Audio fetch failed: \(error?.localizedDescription ?? "Unknown error")")
                return
            }
            
            print("🔊 [AUDIO] Received \(data.count) bytes of audio data")
            
            do {
                let player = try AVAudioPlayer(data: data, fileTypeHint: AVFileType.mp3.rawValue)
                DispatchQueue.main.async {
                    print("🔊 [AUDIO] Audio player created successfully")
                    self.audioPlayer = player
                    self.audioPlayer?.delegate = self
                    self.isSpeaking = true
                    print("▶️ [AUDIO] Starting playback...")
                    self.audioPlayer?.play()
                }
            } catch {
                print("❌ [AUDIO] Failed to create audio player: \(error)")
            }
        }.resume()
    }
    
    func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        DispatchQueue.main.async {
            self.isSpeaking = false
            print("⏹️ [AUDIO] Audio playback finished")
            
            // Start listening for driver response
            if self.drowsySessionActive {
                print("🎤 [AUDIO] Audio finished, starting to listen for driver response...")
                self.startListening()
            }
        }
    }
    
    // MARK: - Speech Recognition
    func startListening() {
        guard !isListening else {
            print("⚠️ [SPEECH] Already listening")
            return
        }
        guard let recognizer = speechRecognizer, recognizer.isAvailable else {
            print("❌ [SPEECH] Speech recognizer not available")
            return
        }
        
        print("🎤 [SPEECH] Starting to listen for driver response...")
        
        do {
            try audioEngine.start()
            recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
            guard let recognitionRequest = recognitionRequest else {
                print("❌ [SPEECH] Failed to create recognition request")
                return
            }
            
            recognitionRequest.shouldReportPartialResults = true
            
            recognitionTask = recognizer.recognitionTask(with: recognitionRequest) { [weak self] result, error in
                guard let self = self else { return }
                
                if let error = error {
                    print("❌ [SPEECH] Recognition error: \(error)")
                    self.stopListening()
                    return
                }
                
                if let result = result {
                    let transcript = result.bestTranscription.formattedString
                    DispatchQueue.main.async {
                        self.lastTranscript = transcript
                        print("🎙️ [SPEECH] Partial: \(transcript)")
                    }
                    
                    // If final result, send to chat
                    if result.isFinal {
                        print("🎙️ [SPEECH] Final transcript: \(transcript)")
                        self.stopListening()
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                            print("📤 [SPEECH] Sending driver response to chat API")
                            self.requestChatResponse(message: transcript, driverState: self.currentDriverState)
                        }
                    }
                }
            }
            
            // Configure audio input
            let inputNode = audioEngine.inputNode
            let recordingFormat = inputNode.outputFormat(forBus: 0)
            print("🎤 [SPEECH] Audio format: \(recordingFormat)")
            inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { buffer, _ in
                recognitionRequest.append(buffer)
            }
            
            audioEngine.prepare()
            try audioEngine.start()
            isListening = true
            print("✅ [SPEECH] Listening active")
        } catch {
            print("❌ [SPEECH] Audio engine error: \(error)")
        }
    }
    
    func stopListening() {
        audioEngine.stop()
        audioEngine.inputNode.removeTap(onBus: 0)
        recognitionRequest?.endAudio()
        recognitionTask?.cancel()
        isListening = false
        print("🎤 [SPEECH] Stopped listening")
    }
}

// MARK: - Models
struct ChatResponse: Codable {
    let reply: String
    let audioUrl: String
}

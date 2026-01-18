import SwiftUI
import SmartSpectraSwiftSDK
import Combine
import CoreLocation
import SwiftProtobuf

struct ContentView: View {
    @ObservedObject var sdk = SmartSpectraSwiftSDK.shared
    @StateObject var locationManager = LocationManager()
    @StateObject var drowsinessDetector = DrowsinessDetector()
    
    let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    init() {
        sdk.setApiKey(Secrets.apiKey)
        
        #if targetEnvironment(simulator)
        print("Running in Simulator - Camera may not function as expected.")
        #endif
    }

    var body: some View {
        ZStack {
            SmartSpectraView()
                .onAppear {
                    #if targetEnvironment(macCatalyst)
                    print("Running on Mac (Catalyst)")
                    #endif
                }
            
            VStack {
                Spacer()
                VStack(spacing: 8) {
                    Text("State: \(drowsinessDetector.currentState)")
                        .font(.headline)
                    Text("Pulse: \(String(format: "%.1f", drowsinessDetector.lastPulse)) bpm")
                    Text("Breathing: \(String(format: "%.1f", drowsinessDetector.lastBreathing)) rpm")
                    Text("Confidence: \(drowsinessDetector.confidenceLevel)")
                        .font(.caption)
                }
                .foregroundColor(.white)
                .padding()
                .background(Color.black.opacity(0.7))
                .cornerRadius(10)
                .padding()
            }
        }
        .onReceive(timer) { _ in
            processAndSendUpdate()
        }
    }
    
    func processAndSendUpdate() {
        guard let buffer = sdk.metricsBuffer, buffer.isInitialized else {
            print("⚠️ Metrics buffer not initialized")
            return
        }
        
        // Extract the latest measurements from rate arrays
        let pulseRates = buffer.pulse.rate
        let breathingRates = buffer.breathing.rate
        
        guard !pulseRates.isEmpty && !breathingRates.isEmpty else {
            print("⚠️ No measurements available yet")
            return
        }
        
        // Get the most recent measurements
        let latestPulse = pulseRates.last!
        let latestBreathing = breathingRates.last!
        
        print("------- PRESAGE DATA -------")
        print("Pulse: \(latestPulse.value) bpm (confidence: \(latestPulse.confidence), stable: \(latestPulse.stable))")
        print("Breathing: \(latestBreathing.value) rpm (confidence: \(latestBreathing.confidence), stable: \(latestBreathing.stable))")
        print("Total pulse measurements: \(pulseRates.count)")
        print("Total breathing measurements: \(breathingRates.count)")
        
        // Check if strict values are available
        if buffer.pulse.hasStrict {
            print("Pulse strict value: \(buffer.pulse.strict.value)")
        }
        if buffer.breathing.hasStrict {
            print("Breathing strict value: \(buffer.breathing.strict.value)")
        }
        
        print("---------------------------")
        
        // Update detector with new measurements
        drowsinessDetector.update(
            pulse: Double(latestPulse.value),
            breathing: Double(latestBreathing.value),
            pulseConfidence: latestPulse.confidence,
            breathingConfidence: latestBreathing.confidence,
            pulseStable: latestPulse.stable,
            breathingStable: latestBreathing.stable
        )
        
        let state = drowsinessDetector.currentState
        
        // Get Location
        let lat = locationManager.lastLocation?.latitude ?? 37.7749
        let lon = locationManager.lastLocation?.longitude ?? -122.4194
        
        NetworkManager.shared.sendUpdate(
            driverId: "101",
            state: state,
            lat: lat,
            lon: lon
        )
        
    }
}

// MARK: - Drowsiness Detection Logic
class DrowsinessDetector: ObservableObject {
    @Published var currentState: String = "Initializing"
    @Published var confidenceLevel: String = "Low"
    @Published var lastPulse: Double = 0
    @Published var lastBreathing: Double = 0
    
    private var measurementHistory: [(pulse: Double, breathing: Double, timestamp: Date)] = []
    private let historyDuration: TimeInterval = 30 // Keep 30 seconds of history
    private var baselinePulse: Double?
    private var baselineBreathing: Double?
    private var consecutiveLowReadings = 0
    
    var hasSufficientData: Bool {
        return confidenceLevel == "Low" && currentState != "Initializing"
    }
    
    func update(
        pulse: Double,
        breathing: Double,
        pulseConfidence: Float,
        breathingConfidence: Float,
        pulseStable: Bool,
        breathingStable: Bool
    ) {
        lastPulse = pulse
        lastBreathing = breathing
        
        // Quality threshold - require high confidence AND stability
        guard pulseConfidence > 0.6 && breathingConfidence > 0.6 else {
            confidenceLevel = "Low"
            print("⚠️ Low confidence - pulse: \(pulseConfidence), breathing: \(breathingConfidence)")
            return
        }
        
        // Filter out invalid readings
        guard pulse > 0 && pulse < 200 && breathing > 0 && breathing < 40 else {
            confidenceLevel = "Low"
            print("⚠️ Invalid readings - pulse: \(pulse), breathing: \(breathing)")
            return
        }
        
        // Add to history
        measurementHistory.append((pulse, breathing, Date()))
        
        // Remove old measurements
        let cutoffTime = Date().addingTimeInterval(-historyDuration)
        measurementHistory.removeAll { $0.timestamp < cutoffTime }
        
        // Establish baseline if we don't have one
        if baselinePulse == nil && measurementHistory.count >= 5 {
            // Use the first stable readings as baseline
            let stableReadings = measurementHistory.prefix(5)
            baselinePulse = stableReadings.map { $0.pulse }.reduce(0, +) / 5
            baselineBreathing = stableReadings.map { $0.breathing }.reduce(0, +) / 5
            print("📊 Baseline established - Pulse: \(String(format: "%.1f", baselinePulse!)), Breathing: \(String(format: "%.1f", baselineBreathing!))")
        }
        
        // Calculate moving averages for stability (last 3 measurements)
        let recentCount = min(3, measurementHistory.count)
        let recentMeasurements = measurementHistory.suffix(recentCount)
        let avgPulse = recentMeasurements.map { $0.pulse }.reduce(0, +) / Double(recentCount)
        let avgBreathing = recentMeasurements.map { $0.breathing }.reduce(0, +) / Double(recentCount)
        
        // Detect state
        currentState = detectDrowsinessState(
            pulse: avgPulse,
            breathing: avgBreathing,
            pulseStable: pulseStable,
            breathingStable: breathingStable
        )
        
        // Update confidence based on measurement stability and count
        let pulseStdDev = standardDeviation(recentMeasurements.map { $0.pulse })
        let breathingStdDev = standardDeviation(recentMeasurements.map { $0.breathing })
        
        if pulseStable && breathingStable && pulseStdDev < 5 && breathingStdDev < 2 && measurementHistory.count >= 3 {
            confidenceLevel = "High"
        } else if measurementHistory.count >= 2 && (pulseStable || breathingStable) {
            confidenceLevel = "Medium"
        } else {
            confidenceLevel = "Low"
        }
    }
    
    private func detectDrowsinessState(
        pulse: Double,
        breathing: Double,
        pulseStable: Bool,
        breathingStable: Bool
    ) -> String {
        var drowsinessScore = 0.0
        
        // 1. Heart Rate Analysis
        if let baseline = baselinePulse {
            let pulseChange = (baseline - pulse) / baseline
            
            // Significant decrease from baseline indicates drowsiness/sleep
            if pulseChange > 0.20 {
                drowsinessScore += 3.0 // Strong sleep indicator
                print("💤 Pulse dropped >20% from baseline")
            } else if pulseChange > 0.10 {
                drowsinessScore += 2.0 // Drowsy indicator
                print("😴 Pulse dropped 10-20% from baseline")
            }
        } else {
            // No baseline - use absolute thresholds
            if pulse < 50 {
                drowsinessScore += 3.0
                print("💤 Very low absolute pulse rate")
            } else if pulse < 55 {
                drowsinessScore += 2.0
                print("😴 Low pulse rate")
            } else if pulse < 60 {
                drowsinessScore += 1.0
            }
        }
        
        // 2. Respiratory Rate Analysis
        // Normal resting: 12-20 breaths/min
        // Drowsy: 8-12 breaths/min (relaxed breathing)
        // Sleep: <10 breaths/min (deep sleep breathing)
        if breathing < 8 {
            drowsinessScore += 3.0
            print("💤 Very low breathing rate (<8)")
        } else if breathing < 10 {
            drowsinessScore += 2.5
            print("😴 Low breathing rate (8-10)")
        } else if breathing < 12 {
            drowsinessScore += 1.5
            print("😴 Slightly low breathing rate (10-12)")
        }
        
        // 3. Combined Pattern Recognition
        // Classic drowsy/sleep pattern: Both low HR and low RR together
        if pulse < 60 && breathing < 12 {
            drowsinessScore += 1.5
            print("😴 Combined low pulse + low breathing")
        }
        
        // Extra points for very low combined values (strong sleep indicator)
        if pulse < 55 && breathing < 10 {
            drowsinessScore += 1.0
            print("💤 Very low pulse + very low breathing")
        }
        
        // 4. Stability bonus
        // Stable low readings are more indicative of actual sleep than transient drops
        if pulseStable && breathingStable && (pulse < 60 || breathing < 12) {
            drowsinessScore += 0.5
            print("📊 Stable low readings")
        }
        
        print("📊 Total Drowsiness Score: \(String(format: "%.1f", drowsinessScore))")
        
        // State determination with hysteresis
        // Use consecutive readings to avoid flapping
        let newState: String
        if drowsinessScore >= 2.0 {
            newState = "Asleep"
        } else if drowsinessScore >= 1.5 {
            newState = "Drowsy"
        } else {
            newState = "Normal"
        }
        
        // Track consecutive low readings for more stable detection
        if newState == "Asleep" || newState == "Drowsy" {
            consecutiveLowReadings += 1
        } else {
            consecutiveLowReadings = 0
        }
        
        // Require at least 2 consecutive detections before declaring sleep
        if newState == "Asleep" && consecutiveLowReadings < 2 && currentState != "Asleep" {
            return "Drowsy" // Transition through drowsy state first
        }
        
        return newState
    }
    
    private func standardDeviation(_ values: [Double]) -> Double {
        guard !values.isEmpty else { return 0 }
        let mean = values.reduce(0, +) / Double(values.count)
        let variance = values.map { pow($0 - mean, 2) }.reduce(0, +) / Double(values.count)
        return sqrt(variance)
    }
}

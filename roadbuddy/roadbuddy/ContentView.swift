import SwiftUI
import SmartSpectraSwiftSDK

struct ContentView: View {
    @ObservedObject var sdk = SmartSpectraSwiftSDK.shared

    init() {
        // Initialize SDK with API key from Secrets file
        sdk.setApiKey(Secrets.apiKey)
        
        #if targetEnvironment(simulator)
        // Enable simulator mode if the SDK supports it (this is a hypothetical flag)
        // sdk.enableSimulatorMode(true) 
        print("Running in Simulator - Camera may not function as expected.")
        #endif
    }

    var body: some View {
        SmartSpectraView()
            .onAppear {
                #if targetEnvironment(macCatalyst)
                // If running on Mac via Catalyst
                print("Running on Mac (Catalyst)")
                #endif
            }
    }
}

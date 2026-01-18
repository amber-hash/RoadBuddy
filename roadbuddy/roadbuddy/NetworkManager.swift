import Foundation

struct DriverUpdate: Encodable {
    let driver_id: String
    let state: String
    let lat: Double
    let lon: Double
}

class NetworkManager {
    static let shared = NetworkManager()
    
    // Using Vercel deployment
    private let baseURL = "https://road-buddy-67nvyiltt-ambers-projects-bc58a612.vercel.app"
    
    func sendUpdate(driverId: String, state: String, lat: Double, lon: Double) {
        let endpoint = "\(baseURL)/api/drivers/driver"
        let payload = DriverUpdate(driver_id: driverId, state: state, lat: lat, lon: lon)
        
        guard let url = URL(string: endpoint) else {
            print("❌ [NETWORK] Invalid URL: \(endpoint)")
            return
        }
        
        print("📤 [NETWORK] Sending driver update to: \(endpoint)")
        
        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            let jsonData = try JSONEncoder().encode(payload)
            request.httpBody = jsonData
            
            // Log for debugging
            if let jsonString = String(data: jsonData, encoding: .utf8) {
                print("📤 [NETWORK] Payload: \(jsonString)")
            }
            
            let task = URLSession.shared.dataTask(with: request) { data, response, error in
                if let error = error {
                    print("❌ [NETWORK] Error: \(error.localizedDescription)")
                    return
                }
                
                if let httpResponse = response as? HTTPURLResponse {
                    print("📥 [NETWORK] Response Code: \(httpResponse.statusCode)")
                }
            }
            task.resume()
            
        } catch {
            print("❌ [NETWORK] Encoding Error: \(error.localizedDescription)")
        }
    }
}

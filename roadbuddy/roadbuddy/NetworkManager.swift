import Foundation

struct DriverUpdate: Encodable {
    let driver_id: String
    let state: String
    let lat: Double
    let lon: Double
}

class NetworkManager {
    static let shared = NetworkManager()
    
    // Using your local IP from analysis
    private let endpoint = "http://10.206.38.172:3000/api/drivers/driver"
    
    func sendUpdate(driverId: String, state: String, lat: Double, lon: Double) {
        let payload = DriverUpdate(driver_id: driverId, state: state, lat: lat, lon: lon)
        
        guard let url = URL(string: endpoint) else {
            print("Invalid URL: \(endpoint)")
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            let jsonData = try JSONEncoder().encode(payload)
            request.httpBody = jsonData
            
            // Log for debugging
            if let jsonString = String(data: jsonData, encoding: .utf8) {
                print("Sending Update: \(jsonString)")
            }
            
            let task = URLSession.shared.dataTask(with: request) { data, response, error in
                if let error = error {
                    print("Network Error: \(error.localizedDescription)")
                    return
                }
                
                if let httpResponse = response as? HTTPURLResponse {
                    print("Server Response Code: \(httpResponse.statusCode)")
                }
            }
            task.resume()
            
        } catch {
            print("Encoding Error: \(error.localizedDescription)")
        }
    }
}

// Test asleep driver emergency protocol
const testAsleepEmergency = async () => {
    try {
      console.log("Testing asleep driver emergency protocol...\n");
  
      // Simulate asleep driver detection
      // This should trigger alarm + 911 call simulation
      const response = await fetch("http://localhost:3000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "", // Empty message - not needed for emergency
          driverState: "asleep"
        }),
      });
  
      console.log("Status:", response.status);
  
      const data = await response.json();
      console.log("\n=== Emergency Response ===");
      console.log("Reply:", data.reply);
      console.log("Driver State:", data.driverState);
      console.log("Is Emergency:", data.isEmergency);
      console.log("Alarm Audio URL:", data.audioUrl);
      console.log("Emergency Call Audio URL:", data.emergencyAudioUrl);
  
      if (data.audioUrl) {
        console.log("\nYou can play the ALARM at:");
        console.log(`http://localhost:3000${data.audioUrl}`);
      }
  
      if (data.emergencyAudioUrl) {
        console.log("\nYou can play the EMERGENCY CALL at:");
        console.log(`http://localhost:3000${data.emergencyAudioUrl}`);
      }
  
      // Verify emergency response structure
      if (data.isEmergency && data.driverState === "emergency") {
        console.log("\n✅ Emergency protocol triggered successfully!");
      } else {
        console.log("\n❌ Emergency protocol failed to trigger");
      }
  
    } catch (error) {
      console.error("Error:", error.message);
    }
  };
  
  // Test asleep driver with message (should still trigger emergency)
  const testAsleepWithMessage = async () => {
    try {
      console.log("\n\nTesting asleep driver with message (should still trigger emergency)...\n");
  
      const response = await fetch("http://localhost:3000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "Help me", // Message should be ignored for emergency
          driverState: "asleep"
        }),
      });
  
      console.log("Status:", response.status);
  
      const data = await response.json();
      console.log("\n=== Response ===");
      console.log("Reply:", data.reply);
      console.log("Is Emergency:", data.isEmergency);
  
      if (data.isEmergency) {
        console.log("✅ Emergency protocol triggered despite message input");
      } else {
        console.log("❌ Emergency protocol should trigger regardless of message");
      }
  
    } catch (error) {
      console.error("Error:", error.message);
    }
  };
  
  // Test normal states to ensure they don't trigger emergency
  const testNormalStates = async () => {
    try {
      console.log("\n\nTesting normal states (should NOT trigger emergency)...\n");
  
      const testCases = [
        { driverState: "alert", message: "I'm fine" },
        { driverState: "drowsy", message: "I'm feeling tired" },
        { driverState: null, message: "Hello" },
        { driverState: undefined, message: "How are you?" }
      ];
  
      for (const testCase of testCases) {
        console.log(`\nTesting driverState: ${testCase.driverState}, message: "${testCase.message}"`);
        
        const response = await fetch("http://localhost:3000/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(testCase),
        });
  
        const data = await response.json();
        
        if (data.isEmergency) {
          console.log("❌ ERROR: Emergency triggered for non-asleep state!");
        } else {
          console.log("✅ OK: No emergency triggered");
        }
      }
  
    } catch (error) {
      console.error("Error:", error.message);
    }
  };
  
  // Run all tests
  const runAllTests = async () => {
    console.log("=== Starting Asleep Driver Emergency Tests ===\n");
    
    await testAsleepEmergency();
    await testAsleepWithMessage();
    await testNormalStates();
    
    console.log("\n=== Tests Complete ===");
  };
  
  // Run the tests
  runAllTests();
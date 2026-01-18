// Test asleep driver emergency protocol (alarm only)
const testAsleepEmergency = async () => {
  try {
    console.log("Testing asleep driver emergency protocol (alarm only)...\n");

    const response = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "",
        driverState: "asleep"
      }),
    });

    console.log("Status:", response.status);

    const data = await response.json();
    console.log("\n=== Emergency Response ===");
    console.log("Reply:", data.reply);
    console.log("Driver State:", data.driverState);
    console.log("Is Emergency:", data.isEmergency);
    console.log("911 Called:", data.nineOneOneCalled);
    console.log("Alarm Audio URL:", data.audioUrl);

    if (data.audioUrl) {
      console.log("\nYou can play the ALARM at:");
      console.log(`http://localhost:3000${data.audioUrl}`);
    }

    // Verify emergency response structure
    if (data.isEmergency && data.driverState === "emergency" && data.nineOneOneCalled) {
      console.log("\n✅ Emergency protocol triggered successfully!");
      console.log("✅ Alarm activated and 911 called message displayed");
    } else {
      console.log("\n❌ Emergency protocol failed to trigger");
    }

  } catch (error) {
    console.error("Error:", error.message);
  }
};

testAsleepEmergency();
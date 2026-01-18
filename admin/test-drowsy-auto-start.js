// Test auto-starting drowsiness conversation
const testDrowsyAutoStart = async () => {
  try {
    console.log("Testing auto-start drowsiness conversation...\n");

    // Simulate drowsiness detection with NO message
    // The backend will automatically start the conversation
    const response = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "", // Empty message - triggers auto-start
        driverState: "drowsy"
      }),
    });

    console.log("Status:", response.status);

    const data = await response.json();
    console.log("\n=== Response ===");
    console.log("Gemini Reply:", data.reply);
    console.log("Audio URL:", data.audioUrl);

    if (data.audioUrl) {
      console.log("\nYou can play the audio at:");
      console.log(`http://localhost:3000${data.audioUrl}`);
    }

  } catch (error) {
    console.error("Error:", error.message);
  }
};

testDrowsyAutoStart();

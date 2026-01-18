// Simple test script for the chat API
const testChatAPI = async () => {
  try {
    console.log("Testing /api/chat endpoint...");

    const response = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Hello, how are you today?"
      }),
    });

    console.log("Status:", response.status);

    const data = await response.json();
    console.log("Response:", JSON.stringify(data, null, 2));

    if (data.audioUrl) {
      console.log("\nYou can play the audio at:");
      console.log(`http://localhost:3000${data.audioUrl}`);
    }

  } catch (error) {
    console.error("Error:", error.message);
  }
};

testChatAPI();

// Check available Gemini models
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');

// Manually load .env.local
const envFile = fs.readFileSync('.env.local', 'utf8');
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    process.env[key.trim()] = value.trim();
  }
});

async function listModels() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    console.log("Checking available models...");
    console.log("API Key:", process.env.GEMINI_API_KEY ? "Set ✓" : "Missing ✗");

    // Try different model names
    const modelsToTry = [
      "gemini-pro",
      "gemini-1.5-pro",
      "gemini-1.5-flash",
      "gemini-1.5-flash-latest",
      "models/gemini-pro",
      "models/gemini-1.5-flash"
    ];

    for (const modelName of modelsToTry) {
      try {
        console.log(`\nTrying model: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello");
        const response = await result.response;
        console.log(`✓ SUCCESS: ${modelName} works!`);
        console.log(`  Response: ${response.text().substring(0, 50)}...`);
        break;
      } catch (error) {
        console.log(`✗ FAILED: ${modelName} - ${error.message.substring(0, 100)}`);
      }
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

listModels();

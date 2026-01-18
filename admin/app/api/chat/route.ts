import fs from "fs";
import path from "path";
import os from "os";
import { NextRequest, NextResponse } from "next/server";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    console.log("=== Starting chat request ===");
    console.log("Environment check:");
    console.log("- GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "✓ Set" : "✗ Missing");
    console.log("- ELEVENLABS_API_KEY:", process.env.ELEVENLABS_API_KEY ? "✓ Set" : "✗ Missing");
    console.log("- ELEVENLABS_VOICE_ID:", process.env.ELEVENLABS_VOICE_ID || "Using default");

    const rawBody = await req.text();
    console.log("Raw request body:", rawBody);

    const body = JSON.parse(rawBody);
    console.log("Parsed body:", body);
    let message = body?.message;
    const driverState = body?.driverState; // "drowsy", "asleep", or "alert"
    const conversationHistory = body?.conversationHistory || [];

    // Handle asleep driver state
    if (driverState === "asleep") {
      console.log("DRIVER ASLEEP - Initiating emergency protocol");
      
      // 1. Play loud alarm sound only
      const alarmFileName = `alarm-${Date.now()}.mp3`;
      const tmpDir = os.tmpdir();
      const alarmFilePath = path.join(tmpDir, alarmFileName);
      
      // Copy your downloaded alarm MP3 to temp directory
      const alarmSourcePath = path.join(process.cwd(), "public", "sounds", "alarm.mp3");
      if (fs.existsSync(alarmSourcePath)) {
        fs.copyFileSync(alarmSourcePath, alarmFilePath);
        console.log("Alarm file copied to:", alarmFilePath);
      } else {
        console.log("Warning: Alarm file not found at", alarmSourcePath);
      }
      
      // 2. Return emergency response with alarm only
      return NextResponse.json({
        reply: "EMERGENCY: Driver asleep! Alarm activated and 911 has been called.",
        audioUrl: `/api/play?file=${alarmFileName}`,
        driverState: "emergency",
        isEmergency: true,
        nineOneOneCalled: true
      });
    }

    // Auto-start conversation when drowsiness is detected
    if (driverState === "drowsy" && (!message || message.trim() === "")) {
      message = "initiate_drowsy_conversation";
      console.log("Auto-starting drowsiness conversation");
    }

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // --- Build System Prompt based on driver state ---
    let systemPrompt = "";
    let userMessage = message;

    if (driverState === "drowsy") {
      systemPrompt = `You are RoadBuddy, an AI safety assistant for truck drivers. The driver is currently showing signs of DROWSINESS. Your role is to:

1. Keep the driver alert and engaged through conversation
2. Ask stimulating questions that require thoughtful responses
3. Suggest safe actions (pull over, take a break, stretch, coffee)
4. Use an energetic, friendly, and conversational tone
5. Keep responses SHORT (1-2 sentences max) to maintain engagement
6. Avoid yes/no questions - ask open-ended questions
7. Be genuinely interested in their responses

IMPORTANT:
- Prioritize safety above all
- If drowsiness persists, STRONGLY recommend pulling over
- Keep the conversation natural and human-like
- Act like a concerned friend, not a robot`;

      if (message === "initiate_drowsy_conversation") {
        userMessage = "The driver is showing signs of drowsiness. Start the conversation by gently alerting them that you've noticed they seem drowsy, then ask them an engaging question to keep them alert. Be friendly and concerned.";
      } else {
        userMessage = `The driver just said: "${message}"`;
      }
    } else {
      systemPrompt = `You are RoadBuddy, a friendly AI companion for truck drivers. The driver is currently ${driverState || "alert"}. Have a natural, engaging conversation. Keep responses SHORT (1-2 sentences max).`;
      userMessage = message;
    }

    // --- Gemini API ---
    console.log("Calling Gemini API...");
    console.log("Driver State:", driverState || "normal");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt
    });

    const result = await model.generateContent(userMessage);
    const response = await result.response;
    const replyText = response.text();
    console.log("Gemini response:", replyText.substring(0, 100) + "...");

    // --- ElevenLabs SDK ---
    console.log("Calling ElevenLabs API...");
    const voiceId = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
    const elevenClient = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY!,
    });

    const audioStream = await elevenClient.textToSpeech.convert(voiceId, {
      text: replyText,
      modelId: "eleven_multilingual_v2",
    });
    console.log("ElevenLabs stream received");

    // --- Save audio to temp directory ---
    const fileName = `reply-${Date.now()}.mp3`;
    const tmpDir = os.tmpdir();
    const filePath = path.join(tmpDir, fileName);
    console.log("Saving audio to:", filePath);

    const chunks: Uint8Array[] = [];
    const reader = audioStream.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const audioBuffer = Buffer.concat(chunks);
    fs.writeFileSync(filePath, audioBuffer as any);
    console.log("Audio file saved successfully. Size:", audioBuffer.length, "bytes");

    // --- Return JSON ---
    console.log("=== Request completed successfully ===");
    return NextResponse.json({
      reply: replyText,
      audioUrl: `/api/play?file=${fileName}`,
    });

  } catch (error) {
    console.error("POST /api/chat error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
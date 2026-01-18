import fs from "fs";
import path from "path";
import os from "os";
import { NextRequest, NextResponse } from "next/server";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const maxDuration = 60; // 60 second timeout (Vercel Pro max)

// Utility: Timeout promise
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    ),
  ]);
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
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
    const driverState = body?.driverState; // "drowsy", "asleep", or "normal"
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
      systemPrompt = `You are RoadBuddy, a friendly AI companion for truck drivers. The driver is currently ${driverState || "normal"}. Have a natural, engaging conversation. Keep responses SHORT (1-2 sentences max).`;
      userMessage = message;
    }

    // --- Gemini API with timeout ---
    console.log("Calling Gemini API (30s timeout)...");
    console.log("Driver State:", driverState || "normal");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt
    });

    let replyText: string;
    try {
      const result = await withTimeout(
        model.generateContent(userMessage),
        30000 // 30 second timeout for Gemini
      );
      const response = await result.response;
      replyText = response.text();
      console.log("Gemini response:", replyText.substring(0, 100) + "...");
      console.log("Gemini elapsed:", Date.now() - startTime, "ms");
    } catch (geminiError) {
      console.error("❌ Gemini API error:", geminiError);
      // Fallback response if Gemini fails
      replyText = "Hey, I noticed you seem a bit tired. Are you doing okay? Let's keep you alert!";
      console.log("Using fallback response");
    }

    // --- ElevenLabs SDK with timeout ---
    console.log("Calling ElevenLabs API (20s timeout)...");
    const voiceId = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
    const elevenClient = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY!,
    });

    let audioStream: any;
    try {
      audioStream = await withTimeout(
        elevenClient.textToSpeech.convert(voiceId, {
          text: replyText,
          modelId: "eleven_multilingual_v2",
        }),
        20000 // 20 second timeout for ElevenLabs
      );
      console.log("ElevenLabs stream received");
      console.log("ElevenLabs elapsed:", Date.now() - startTime, "ms");
    } catch (elevenError) {
      console.error("❌ ElevenLabs API error:", elevenError);
      return NextResponse.json(
        {
          error: "Text-to-speech failed",
          details: elevenError instanceof Error ? elevenError.message : String(elevenError)
        },
        { status: 503 }
      );
    }

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
    const elapsed = Date.now() - startTime;
    console.error("POST /api/chat error:", error);
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    console.error("Total elapsed:", elapsed, "ms");
    
    // Handle timeout errors specifically
    if (error instanceof Error && error.message.includes("Timeout")) {
      return NextResponse.json(
        {
          error: "Request timeout - AI service took too long to respond",
          details: error.message
        },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
        elapsed
      },
      { status: 500 }
    );
  }
}
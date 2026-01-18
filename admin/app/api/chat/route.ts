import fs from "fs";
import path from "path";
import os from "os";
import { NextRequest, NextResponse } from "next/server";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// IMPORTANT: ensure Node runtime (fs is not allowed in edge)
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    console.log("=== Starting chat request ===");
    console.log("Environment check:");
    console.log("- GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "✓ Set" : "✗ Missing");
    console.log("- ELEVENLABS_API_KEY:", process.env.ELEVENLABS_API_KEY ? "✓ Set" : "✗ Missing");
    console.log("- ELEVENLABS_VOICE_ID:", process.env.ELEVENLABS_VOICE_ID || "Using default");

    const rawBody = await req.text(); // <-- get raw text
    console.log("Raw request body:", rawBody);

    const body = JSON.parse(rawBody); // <-- manually parse
    console.log("Parsed body:", body);
    const message = body?.message;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // --- Gemini API ---
    console.log("Calling Gemini API...");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent(message);
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

    // Convert stream to buffer and save
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

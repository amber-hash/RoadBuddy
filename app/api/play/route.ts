import fs from "fs";
import path from "path";
import os from "os";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const file = url.searchParams.get("file");
    if (!file) return NextResponse.json({ error: "file query required" }, { status: 400 });

    const tmpDir = os.tmpdir();
    const filePath = path.join(tmpDir, file);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const stat = fs.statSync(filePath);
    const buffer = fs.readFileSync(filePath);

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(stat.size),
      },
    });
  } catch (error) {
    console.error("/api/play error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

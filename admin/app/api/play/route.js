import fs from "fs";
import path from "path";
import os from "os";

export const GET = (req) => {
  const { searchParams } = new URL(req.url);
  const file = searchParams.get("file");
  const tmpDir = os.tmpdir();
  const filePath = path.join(tmpDir, file);

  if (!fs.existsSync(filePath)) {
    return new Response(JSON.stringify({ error: "File not found" }), { status: 404 });
  }

  const stat = fs.statSync(filePath);
  const audioBuffer = fs.readFileSync(filePath);

  return new Response(audioBuffer, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": stat.size,
    },
  });
};

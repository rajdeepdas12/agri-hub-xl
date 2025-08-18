import { NextResponse } from "next/server"

export async function GET() {
  const config = {
    geminiApiKey: {
      serverSide: !!process.env.GEMINI_API_KEY,
      clientSide: !!process.env.NEXT_PUBLIC_GEMINI_API_KEY,
      value: process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY ? "Configured" : "Not configured"
    },
    geminiModel: process.env.NEXT_PUBLIC_GEMINI_MODEL || "gemini-2.0-flash-exp",
    uploadDir: process.env.UPLOAD_DIR || "./uploads",
    maxFileSize: process.env.MAX_FILE_SIZE || "20971520",
    nodeEnv: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString()
  }

  return NextResponse.json({
    success: true,
    config,
    message: "Environment configuration check completed"
  })
}
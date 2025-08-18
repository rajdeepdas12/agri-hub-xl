import { NextResponse } from "next/server"

export async function GET() {
  const config = {
    plantIdApiKey: {
      serverSide: !!process.env.PLANT_ID_API_KEY,
      clientSide: !!process.env.NEXT_PUBLIC_PLANT_ID_API_KEY,
      value: process.env.PLANT_ID_API_KEY || process.env.NEXT_PUBLIC_PLANT_ID_API_KEY ? "Configured" : "Not configured"
    },
    plantIdApiUrl: process.env.PLANT_ID_API_URL || "https://plant.id/api/v3",
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
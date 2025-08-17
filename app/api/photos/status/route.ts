import { type NextRequest, NextResponse } from "next/server"
import { checkDatabaseConnection } from "@/lib/database"
import FileStorage from "@/lib/file-storage"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Checking photo system status...")

    // Check database connection
    const dbConnected = await checkDatabaseConnection()

    // Check file storage
    const storageStats = await FileStorage.getStorageStats()

    // Check if upload directory is writable
    let storageWritable = true
    try {
      await FileStorage.cleanupTempFiles(0) // This will test write permissions
    } catch (error) {
      storageWritable = false
      console.error("[v0] Storage not writable:", error)
    }

    const status = {
      database: {
        connected: dbConnected,
        status: dbConnected ? "healthy" : "error",
      },
      storage: {
        writable: storageWritable,
        stats: storageStats,
        status: storageWritable ? "healthy" : "error",
      },
      overall: dbConnected && storageWritable ? "healthy" : "error",
      timestamp: new Date().toISOString(),
    }

    console.log("[v0] Photo system status:", status)

    return NextResponse.json({
      success: true,
      status,
    })
  } catch (error) {
    console.error("[v0] Status check error:", error)
    return NextResponse.json(
      {
        error: "Failed to check system status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

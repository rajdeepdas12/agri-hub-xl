import { type NextRequest, NextResponse } from "next/server"
import FileStorage from "@/lib/file-storage"
import { DatabaseService } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const userId = formData.get("userId") as string
    const flightId = formData.get("flightId") as string

    if (!file) {
      return NextResponse.json({ error: "No telemetry file provided" }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    if (!flightId) {
      return NextResponse.json({ error: "Flight ID required" }, { status: 400 })
    }

    // Validate file type (JSON or CSV for telemetry data)
    if (!["application/json", "text/csv"].includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only JSON and CSV files are supported" }, { status: 400 })
    }

    // Save telemetry file
    const savedFile = await FileStorage.saveUploadedFile(file, "drone-data", Number.parseInt(userId))

    // Process telemetry data
    const processedData = await FileStorage.processDroneData(savedFile.filepath)

    // Update flight record with telemetry data
    if (processedData) {
      await DatabaseService.query(
        `UPDATE drone_data 
         SET flight_path = $1, weather_conditions = $2, altitude_avg = $3, 
             photos_taken = $4, flight_duration = $5, updated_at = CURRENT_TIMESTAMP
         WHERE flight_id = $6 AND user_id = $7`,
        [
          JSON.stringify(processedData.coordinates || []),
          JSON.stringify(processedData.weather || {}),
          processedData.altitude?.avg || null,
          processedData.photos || 0,
          processedData.duration || null,
          flightId,
          Number.parseInt(userId),
        ],
      )
    }

    return NextResponse.json({
      success: true,
      telemetry: {
        filename: savedFile.filename,
        filepath: savedFile.filepath,
        size: savedFile.size,
        processedData,
      },
      message: "Telemetry data uploaded and processed successfully",
    })
  } catch (error) {
    console.error("[v0] Telemetry upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload telemetry data", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

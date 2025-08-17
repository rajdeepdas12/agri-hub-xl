import { type NextRequest, NextResponse } from "next/server"
import { LocalDatabaseService } from "@/lib/local-database"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Export analytics request received")
    const body = await request.json()
    const { userId, dataTypes, format, dateRange } = body

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    console.log("[v0] Exporting data for user:", userId, "types:", dataTypes)

    const startDate = new Date(dateRange.start)
    const endDate = new Date(dateRange.end)
    const exportData: any = {}
    const db = LocalDatabaseService.getInstance()

    // Export sensor readings (simulated data since we don't have real sensor data)
    if (dataTypes.includes("sensor_readings")) {
      exportData.sensor_readings = [
        {
          id: 1,
          field_name: "North Field",
          temperature: 22.5,
          humidity: 65,
          soil_moisture: 45,
          ph_level: 6.8,
          timestamp: new Date().toISOString(),
        },
        {
          id: 2,
          field_name: "South Field",
          temperature: 24.1,
          humidity: 58,
          soil_moisture: 52,
          ph_level: 7.2,
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
      ]
    }

    // Export drone flights (from local database)
    if (dataTypes.includes("drone_flights")) {
      const droneData = db.getDroneFlights(Number.parseInt(userId))
      exportData.drone_flights = droneData.filter((flight: any) => {
        const flightDate = new Date(flight.created_at)
        return flightDate >= startDate && flightDate <= endDate
      })
    }

    // Export photo analysis (from local database)
    if (dataTypes.includes("photo_analysis")) {
      const photos = db.getRecentPhotos(Number.parseInt(userId), 100) // Get more photos for export
      exportData.photo_analysis = photos.filter((photo: any) => {
        const photoDate = new Date(photo.created_at)
        return photoDate >= startDate && photoDate <= endDate
      })
    }

    // Export weather data (simulated)
    if (dataTypes.includes("weather_data")) {
      exportData.weather_data = [
        {
          date: new Date().toISOString(),
          temperature: 22.5,
          humidity: 65,
          rainfall: 0.2,
          wind_speed: 8.3,
          uv_index: 6,
          field_id: 1,
        },
        {
          date: new Date(Date.now() - 86400000).toISOString(),
          temperature: 21.8,
          humidity: 72,
          rainfall: 1.5,
          wind_speed: 12.1,
          uv_index: 4,
          field_id: 1,
        },
      ]
    }

    // Generate export file URL
    const exportId = `export_${Date.now()}_${userId}`
    const downloadUrl = `/api/reports/download/${exportId}.${format}`

    console.log("[v0] Export completed successfully:", exportId)

    return NextResponse.json({
      success: true,
      exportId,
      downloadUrl,
      recordCount: {
        sensor_readings: exportData.sensor_readings?.length || 0,
        drone_flights: exportData.drone_flights?.length || 0,
        photo_analysis: exportData.photo_analysis?.length || 0,
        weather_data: exportData.weather_data?.length || 0,
      },
      format,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    })
  } catch (error) {
    console.error("[v0] Export analytics error:", error)
    return NextResponse.json(
      {
        error: "Failed to export analytics data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

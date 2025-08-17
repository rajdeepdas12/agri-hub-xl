import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      fieldId,
      droneId,
      flightId,
      missionType,
      startTime,
      endTime,
      batteryStart,
      batteryEnd,
      weatherConditions,
      flightPath,
      altitudeAvg,
      speedAvg,
      areaCovered,
      photosTaken,
      notes,
    } = body

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    if (!flightId) {
      return NextResponse.json({ error: "Flight ID required" }, { status: 400 })
    }

    // Calculate flight duration if start and end times provided
    let flightDuration = null
    if (startTime && endTime) {
      const start = new Date(startTime)
      const end = new Date(endTime)
      flightDuration = Math.floor((end.getTime() - start.getTime()) / 1000) // in seconds
    }

    const droneData = {
      user_id: Number.parseInt(userId),
      field_id: fieldId ? Number.parseInt(fieldId) : null,
      drone_id: droneId,
      flight_id: flightId,
      mission_type: missionType,
      start_time: startTime ? new Date(startTime) : null,
      end_time: endTime ? new Date(endTime) : null,
      flight_duration: flightDuration,
      battery_start: batteryStart,
      battery_end: batteryEnd,
      weather_conditions: weatherConditions,
      flight_path: flightPath,
      altitude_avg: altitudeAvg,
      speed_avg: speedAvg,
      area_covered: areaCovered,
      photos_taken: photosTaken || 0,
      status: "completed",
      notes,
    }

    const flight = await DatabaseService.saveDroneData(droneData)

    return NextResponse.json({
      success: true,
      flight: {
        id: flight.id,
        userId: flight.user_id,
        fieldId: flight.field_id,
        droneId: flight.drone_id,
        flightId: flight.flight_id,
        missionType: flight.mission_type,
        startTime: flight.start_time,
        endTime: flight.end_time,
        flightDuration: flight.flight_duration,
        batteryStart: flight.battery_start,
        batteryEnd: flight.battery_end,
        weatherConditions: flight.weather_conditions,
        flightPath: flight.flight_path,
        altitudeAvg: flight.altitude_avg,
        speedAvg: flight.speed_avg,
        areaCovered: flight.area_covered,
        photosTaken: flight.photos_taken,
        status: flight.status,
        notes: flight.notes,
        createdAt: flight.created_at,
      },
    })
  } catch (error) {
    console.error("[v0] Drone flight creation error:", error)
    return NextResponse.json(
      { error: "Failed to create flight record", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const fieldId = searchParams.get("fieldId")
    const missionType = searchParams.get("missionType")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    // Build query with filters
    let whereClause = "WHERE user_id = $1"
    const queryParams = [Number.parseInt(userId)]
    let paramIndex = 2

    if (fieldId) {
      whereClause += ` AND field_id = $${paramIndex}`
      queryParams.push(Number.parseInt(fieldId))
      paramIndex++
    }

    if (missionType) {
      whereClause += ` AND mission_type = $${paramIndex}`
      queryParams.push(missionType)
      paramIndex++
    }

    const flightsQuery = `
      SELECT d.*, f.name as field_name 
      FROM drone_data d
      LEFT JOIN fields f ON d.field_id = f.id
      ${whereClause}
      ORDER BY d.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    queryParams.push(limit, offset)

    const { rows } = await DatabaseService.query(flightsQuery, queryParams)

    const flights = rows.map((flight) => ({
      id: flight.id,
      userId: flight.user_id,
      fieldId: flight.field_id,
      fieldName: flight.field_name,
      droneId: flight.drone_id,
      flightId: flight.flight_id,
      missionType: flight.mission_type,
      startTime: flight.start_time,
      endTime: flight.end_time,
      flightDuration: flight.flight_duration,
      batteryStart: flight.battery_start,
      batteryEnd: flight.battery_end,
      weatherConditions: flight.weather_conditions,
      flightPath: flight.flight_path,
      altitudeAvg: flight.altitude_avg,
      speedAvg: flight.speed_avg,
      areaCovered: flight.area_covered,
      photosTaken: flight.photos_taken,
      status: flight.status,
      notes: flight.notes,
      createdAt: flight.created_at,
    }))

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) FROM drone_data ${whereClause}`
    const countParams = queryParams.slice(0, -2) // Remove limit and offset
    const { rows: countRows } = await DatabaseService.query(countQuery, countParams)
    const totalCount = Number.parseInt(countRows[0].count)

    return NextResponse.json({
      success: true,
      flights,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    })
  } catch (error) {
    console.error("[v0] Get drone flights error:", error)
    return NextResponse.json({ error: "Failed to get flights" }, { status: 500 })
  }
}

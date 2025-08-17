import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const flightId = Number.parseInt(params.id)

    if (isNaN(flightId)) {
      return NextResponse.json({ error: "Invalid flight ID" }, { status: 400 })
    }

    const { rows } = await query(
      `SELECT d.*, f.name as field_name, u.username 
       FROM drone_data d
       LEFT JOIN fields f ON d.field_id = f.id
       LEFT JOIN users u ON d.user_id = u.id
       WHERE d.id = $1`,
      [flightId],
    )

    const flight = rows[0]

    if (!flight) {
      return NextResponse.json({ error: "Flight not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      flight: {
        id: flight.id,
        userId: flight.user_id,
        username: flight.username,
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
      },
    })
  } catch (error) {
    console.error("[v0] Get flight error:", error)
    return NextResponse.json({ error: "Failed to get flight" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const flightId = Number.parseInt(params.id)
    const body = await request.json()

    if (isNaN(flightId)) {
      return NextResponse.json({ error: "Invalid flight ID" }, { status: 400 })
    }

    const updateFields = []
    const updateValues = []
    let paramIndex = 1

    // Build dynamic update query
    const allowedFields = [
      "mission_type",
      "battery_start",
      "battery_end",
      "weather_conditions",
      "altitude_avg",
      "speed_avg",
      "area_covered",
      "photos_taken",
      "status",
      "notes",
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateFields.push(`${field} = $${paramIndex}`)
        updateValues.push(body[field])
        paramIndex++
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`)
    updateValues.push(flightId)

    const updateQuery = `
      UPDATE drone_data 
      SET ${updateFields.join(", ")} 
      WHERE id = $${paramIndex}
      RETURNING *
    `

    const { rows } = await query(updateQuery, updateValues)
    const updatedFlight = rows[0]

    return NextResponse.json({
      success: true,
      flight: {
        id: updatedFlight.id,
        userId: updatedFlight.user_id,
        fieldId: updatedFlight.field_id,
        droneId: updatedFlight.drone_id,
        flightId: updatedFlight.flight_id,
        missionType: updatedFlight.mission_type,
        startTime: updatedFlight.start_time,
        endTime: updatedFlight.end_time,
        flightDuration: updatedFlight.flight_duration,
        batteryStart: updatedFlight.battery_start,
        batteryEnd: updatedFlight.battery_end,
        weatherConditions: updatedFlight.weather_conditions,
        flightPath: updatedFlight.flight_path,
        altitudeAvg: updatedFlight.altitude_avg,
        speedAvg: updatedFlight.speed_avg,
        areaCovered: updatedFlight.area_covered,
        photosTaken: updatedFlight.photos_taken,
        status: updatedFlight.status,
        notes: updatedFlight.notes,
        createdAt: updatedFlight.created_at,
      },
    })
  } catch (error) {
    console.error("[v0] Update flight error:", error)
    return NextResponse.json({ error: "Failed to update flight" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const flightId = Number.parseInt(params.id)

    if (isNaN(flightId)) {
      return NextResponse.json({ error: "Invalid flight ID" }, { status: 400 })
    }

    // Delete flight record
    const { rowCount } = await query("DELETE FROM drone_data WHERE id = $1", [flightId])

    if (rowCount === 0) {
      return NextResponse.json({ error: "Flight not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Flight deleted successfully",
    })
  } catch (error) {
    console.error("[v0] Delete flight error:", error)
    return NextResponse.json({ error: "Failed to delete flight" }, { status: 500 })
  }
}

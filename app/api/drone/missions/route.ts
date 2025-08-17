import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, fieldId, missionType, plannedRoute, estimatedDuration, droneId, scheduledTime } = body

    if (!userId || !missionType) {
      return NextResponse.json({ error: "User ID and mission type required" }, { status: 400 })
    }

    // Generate unique mission ID
    const missionId = `mission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create mission record in drone_data table with 'planned' status
    const missionData = {
      user_id: Number.parseInt(userId),
      field_id: fieldId ? Number.parseInt(fieldId) : null,
      drone_id: droneId,
      flight_id: missionId,
      mission_type: missionType,
      start_time: scheduledTime ? new Date(scheduledTime) : null,
      flight_duration: estimatedDuration,
      flight_path: plannedRoute,
      status: "planned",
      notes: `Planned mission: ${missionType}`,
    }

    const insertQuery = `
      INSERT INTO drone_data (user_id, field_id, drone_id, flight_id, mission_type, 
                             start_time, flight_duration, flight_path, status, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `

    const { rows } = await query(insertQuery, [
      missionData.user_id,
      missionData.field_id,
      missionData.drone_id,
      missionData.flight_id,
      missionData.mission_type,
      missionData.start_time,
      missionData.flight_duration,
      JSON.stringify(missionData.flight_path),
      missionData.status,
      missionData.notes,
    ])

    const mission = rows[0]

    return NextResponse.json({
      success: true,
      mission: {
        id: mission.id,
        missionId: mission.flight_id,
        userId: mission.user_id,
        fieldId: mission.field_id,
        droneId: mission.drone_id,
        missionType: mission.mission_type,
        scheduledTime: mission.start_time,
        estimatedDuration: mission.flight_duration,
        plannedRoute: mission.flight_path,
        status: mission.status,
        notes: mission.notes,
        createdAt: mission.created_at,
      },
    })
  } catch (error) {
    console.error("[v0] Mission planning error:", error)
    return NextResponse.json({ error: "Failed to create mission plan" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const status = searchParams.get("status") || "planned"

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const missionsQuery = `
      SELECT d.*, f.name as field_name 
      FROM drone_data d
      LEFT JOIN fields f ON d.field_id = f.id
      WHERE d.user_id = $1 AND d.status = $2
      ORDER BY d.start_time ASC, d.created_at DESC
    `

    const { rows } = await query(missionsQuery, [Number.parseInt(userId), status])

    const missions = rows.map((mission) => ({
      id: mission.id,
      missionId: mission.flight_id,
      userId: mission.user_id,
      fieldId: mission.field_id,
      fieldName: mission.field_name,
      droneId: mission.drone_id,
      missionType: mission.mission_type,
      scheduledTime: mission.start_time,
      estimatedDuration: mission.flight_duration,
      plannedRoute: mission.flight_path,
      status: mission.status,
      notes: mission.notes,
      createdAt: mission.created_at,
    }))

    return NextResponse.json({
      success: true,
      missions,
      count: missions.length,
    })
  } catch (error) {
    console.error("[v0] Get missions error:", error)
    return NextResponse.json({ error: "Failed to get missions" }, { status: 500 })
  }
}

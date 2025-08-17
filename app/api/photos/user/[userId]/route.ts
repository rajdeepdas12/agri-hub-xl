import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const userId = Number.parseInt(params.userId)
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const source = searchParams.get("source") // 'upload', 'drone', 'satellite'
    const fieldId = searchParams.get("fieldId")

    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    // Build query with filters
    let whereClause = "WHERE user_id = $1"
    const queryParams = [userId]
    let paramIndex = 2

    if (source) {
      whereClause += ` AND source = $${paramIndex}`
      queryParams.push(source)
      paramIndex++
    }

    if (fieldId) {
      whereClause += ` AND field_id = $${paramIndex}`
      queryParams.push(Number.parseInt(fieldId))
      paramIndex++
    }

    const photosQuery = `
      SELECT p.*, f.name as field_name 
      FROM photos p
      LEFT JOIN fields f ON p.field_id = f.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    queryParams.push(limit, offset)

    const { rows } = await DatabaseService.query(photosQuery, queryParams)

    const photos = rows.map((photo) => ({
      id: photo.id,
      userId: photo.user_id,
      fieldId: photo.field_id,
      fieldName: photo.field_name,
      filename: photo.filename,
      originalName: photo.original_name,
      filePath: photo.file_path,
      fileSize: photo.file_size,
      mimeType: photo.mime_type,
      source: photo.source,
      captureDate: photo.capture_date,
      gpsLatitude: photo.gps_latitude,
      gpsLongitude: photo.gps_longitude,
      altitude: photo.altitude,
      analysisStatus: photo.analysis_status,
      analysisResults: photo.analysis_results,
      tags: photo.tags,
      createdAt: photo.created_at,
    }))

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) FROM photos ${whereClause}`
    const countParams = queryParams.slice(0, -2) // Remove limit and offset
    const { rows: countRows } = await DatabaseService.query(countQuery, countParams)
    const totalCount = Number.parseInt(countRows[0].count)

    return NextResponse.json({
      success: true,
      photos,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    })
  } catch (error) {
    console.error("[v0] Get user photos error:", error)
    return NextResponse.json({ error: "Failed to get photos" }, { status: 500 })
  }
}

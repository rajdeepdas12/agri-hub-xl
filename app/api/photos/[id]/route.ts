import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import FileStorage from "@/lib/file-storage"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const photoId = Number.parseInt(params.id)

    if (isNaN(photoId)) {
      return NextResponse.json({ error: "Invalid photo ID" }, { status: 400 })
    }

    const { rows } = await query("SELECT * FROM photos WHERE id = $1", [photoId])
    const photo = rows[0]

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      photo: {
        id: photo.id,
        userId: photo.user_id,
        fieldId: photo.field_id,
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
      },
    })
  } catch (error) {
    console.error("[v0] Get photo error:", error)
    return NextResponse.json({ error: "Failed to get photo" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const photoId = Number.parseInt(params.id)

    if (isNaN(photoId)) {
      return NextResponse.json({ error: "Invalid photo ID" }, { status: 400 })
    }

    // Get photo info first
    const { rows } = await query("SELECT * FROM photos WHERE id = $1", [photoId])
    const photo = rows[0]

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 })
    }

    // Delete file from storage
    await FileStorage.deleteFile(photo.file_path)

    // Delete photo record from database
    await query("DELETE FROM photos WHERE id = $1", [photoId])

    return NextResponse.json({
      success: true,
      message: "Photo deleted successfully",
    })
  } catch (error) {
    console.error("[v0] Delete photo error:", error)
    return NextResponse.json({ error: "Failed to delete photo" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const photoId = Number.parseInt(params.id)
    const body = await request.json()

    if (isNaN(photoId)) {
      return NextResponse.json({ error: "Invalid photo ID" }, { status: 400 })
    }

    const updateFields = []
    const updateValues = []
    let paramIndex = 1

    // Build dynamic update query
    if (body.tags !== undefined) {
      updateFields.push(`tags = $${paramIndex}`)
      updateValues.push(body.tags)
      paramIndex++
    }

    if (body.analysisStatus !== undefined) {
      updateFields.push(`analysis_status = $${paramIndex}`)
      updateValues.push(body.analysisStatus)
      paramIndex++
    }

    if (body.analysisResults !== undefined) {
      updateFields.push(`analysis_results = $${paramIndex}`)
      updateValues.push(JSON.stringify(body.analysisResults))
      paramIndex++
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`)
    updateValues.push(photoId)

    const updateQuery = `
      UPDATE photos 
      SET ${updateFields.join(", ")} 
      WHERE id = $${paramIndex}
      RETURNING *
    `

    const { rows } = await query(updateQuery, updateValues)
    const updatedPhoto = rows[0]

    return NextResponse.json({
      success: true,
      photo: {
        id: updatedPhoto.id,
        userId: updatedPhoto.user_id,
        fieldId: updatedPhoto.field_id,
        filename: updatedPhoto.filename,
        originalName: updatedPhoto.original_name,
        filePath: updatedPhoto.file_path,
        fileSize: updatedPhoto.file_size,
        mimeType: updatedPhoto.mime_type,
        source: updatedPhoto.source,
        captureDate: updatedPhoto.capture_date,
        analysisStatus: updatedPhoto.analysis_status,
        analysisResults: updatedPhoto.analysis_results,
        tags: updatedPhoto.tags,
        createdAt: updatedPhoto.created_at,
      },
    })
  } catch (error) {
    console.error("[v0] Update photo error:", error)
    return NextResponse.json({ error: "Failed to update photo" }, { status: 500 })
  }
}

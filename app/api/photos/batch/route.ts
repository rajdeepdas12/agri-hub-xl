import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import ImageProcessing from "@/lib/image-processing"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { photoIds, operation } = body

    if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
      return NextResponse.json({ error: "Photo IDs array required" }, { status: 400 })
    }

    if (!operation) {
      return NextResponse.json({ error: "Operation required" }, { status: 400 })
    }

    const results = []

    switch (operation) {
      case "analyze":
        for (const photoId of photoIds) {
          try {
            // Get photo info
            const { rows } = await query("SELECT * FROM photos WHERE id = $1", [photoId])
            const photo = rows[0]

            if (!photo) {
              results.push({ photoId, success: false, error: "Photo not found" })
              continue
            }

            if (!photo.mime_type.startsWith("image/")) {
              results.push({ photoId, success: false, error: "Not an image file" })
              continue
            }

            // Perform analysis
            const analysisResult = await ImageProcessing.analyzeImage(photo.file_path)

            // Update database
            await query(
              `UPDATE photos 
               SET analysis_results = $1, analysis_status = 'completed', updated_at = CURRENT_TIMESTAMP 
               WHERE id = $2`,
              [JSON.stringify(analysisResult), photoId],
            )

            results.push({ photoId, success: true, analysis: analysisResult })
          } catch (error) {
            results.push({
              photoId,
              success: false,
              error: error instanceof Error ? error.message : "Analysis failed",
            })

            // Update status to failed
            await query(
              `UPDATE photos 
               SET analysis_status = 'failed', updated_at = CURRENT_TIMESTAMP 
               WHERE id = $1`,
              [photoId],
            )
          }
        }
        break

      case "delete":
        for (const photoId of photoIds) {
          try {
            // Get photo info for file deletion
            const { rows } = await query("SELECT file_path FROM photos WHERE id = $1", [photoId])
            const photo = rows[0]

            if (photo) {
              // Delete file (ignore errors)
              try {
                const FileStorage = (await import("@/lib/file-storage")).default
                await FileStorage.deleteFile(photo.file_path)
              } catch {
                // File might not exist, continue with database deletion
              }
            }

            // Delete from database
            await query("DELETE FROM photos WHERE id = $1", [photoId])
            results.push({ photoId, success: true })
          } catch (error) {
            results.push({
              photoId,
              success: false,
              error: error instanceof Error ? error.message : "Delete failed",
            })
          }
        }
        break

      case "updateTags": {
        const { tags } = body
        if (!tags || !Array.isArray(tags)) {
          return NextResponse.json({ error: "Tags array required for updateTags operation" }, { status: 400 })
        }

        for (const photoId of photoIds) {
          try {
            await query(
              `UPDATE photos 
               SET tags = $1, updated_at = CURRENT_TIMESTAMP 
               WHERE id = $2`,
              [tags, photoId],
            )
            results.push({ photoId, success: true })
          } catch (error) {
            results.push({
              photoId,
              success: false,
              error: error instanceof Error ? error.message : "Tag update failed",
            })
          }
        }
        break
      }

      default:
        return NextResponse.json({ error: "Invalid operation" }, { status: 400 })
    }

    const successCount = results.filter((r) => r.success).length
    const failureCount = results.length - successCount

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount,
      },
    })
  } catch (error) {
    console.error("[v0] Batch operation error:", error)
    return NextResponse.json({ error: "Batch operation failed" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { LocalDatabaseService, checkLocalDatabaseConnection } from "@/lib/local-database"

export async function GET(request: NextRequest) {
  console.log("[v0] Recent photos request received")

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId") || "1"
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    console.log("[v0] Fetching recent photos for user:", userId, "limit:", limit)

    const dbConnected = await checkLocalDatabaseConnection()
    console.log("[v0] Local database connection:", dbConnected)

    try {
      const photos = await LocalDatabaseService.getRecentPhotos(Number.parseInt(userId), limit)
      console.log("[v0] Retrieved", photos.length, "photos from local database")

      return NextResponse.json({
        success: true,
        photos: photos.map((photo) => ({
          id: photo.id,
          filename: photo.filename,
          originalName: photo.original_name,
          filePath: photo.file_path,
          fileSize: photo.file_size,
          mimeType: photo.mime_type,
          source: photo.source,
          captureDate: photo.capture_date,
          analysisStatus: photo.analysis_status,
          analysisResults: photo.analysis_results,
          tags: photo.tags,
          createdAt: photo.created_at,
        })),
        message: "Photos retrieved from local database",
      })
    } catch (dbError) {
      console.error("[v0] Local database query failed:", dbError)

      const mockPhotos = [
        {
          id: 1,
          filename: "crop_analysis_001.jpg",
          originalName: "field_photo_1.jpg",
          filePath: "/uploads/photos/crop_analysis_001.jpg",
          fileSize: 245760,
          mimeType: "image/jpeg",
          source: "upload",
          captureDate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          analysisStatus: "completed",
          analysisResults: {
            healthScore: 85,
            diseases: ["Leaf Spot"],
            recommendations: ["Apply fungicide", "Improve drainage"],
          },
          tags: ["rice", "disease-detection"],
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
        {
          id: 2,
          filename: "drone_survey_002.jpg",
          originalName: "aerial_view.jpg",
          filePath: "/uploads/photos/drone_survey_002.jpg",
          fileSize: 512000,
          mimeType: "image/jpeg",
          source: "drone",
          captureDate: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
          analysisStatus: "completed",
          analysisResults: {
            healthScore: 92,
            diseases: [],
            recommendations: ["Continue current care routine"],
          },
          tags: ["wheat", "aerial-survey"],
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        },
      ]

      return NextResponse.json({
        success: true,
        photos: mockPhotos,
        message: "Using demo data (local database error)",
      })
    }
  } catch (error) {
    console.error("[v0] Recent photos error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch recent photos",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

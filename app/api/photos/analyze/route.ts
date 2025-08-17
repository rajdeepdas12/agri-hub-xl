import { type NextRequest, NextResponse } from "next/server"
import { analyzeCropDisease, generateAnalysisReport, batchAnalyzeCrops } from "@/lib/gemini-api"
import { LocalDatabaseService } from "@/lib/local-database"

export async function POST(request: NextRequest) {
  console.log("[v0] Crop analysis request received")

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const photoId = formData.get("photoId") as string
    const userId = (formData.get("userId") as string) || "1"

    if (!file && !photoId) {
      return NextResponse.json({ error: "Either file or photoId must be provided" }, { status: 400 })
    }

    let imagePath: string
    let filename: string

    if (file) {
      // Handle direct file upload
      const { saveUploadedFile } = await import("@/lib/file-storage")
      const savedFile = await saveUploadedFile(file, "photos", Number.parseInt(userId))
      imagePath = savedFile.filepath
      filename = savedFile.filename
    } else {
      // Get existing photo from database
      const photo = await LocalDatabaseService.getPhotoById(Number.parseInt(photoId))
      if (!photo) {
        return NextResponse.json({ error: "Photo not found" }, { status: 404 })
      }
      imagePath = photo.file_path
      filename = photo.filename
    }

    console.log("[v0] Analyzing image:", imagePath)

    // Perform comprehensive crop disease analysis
    const analysis = await analyzeCropDisease(imagePath)
    
    // Generate detailed report
    const report = await generateAnalysisReport(analysis)

    // Update database if photoId was provided
    if (photoId) {
      await LocalDatabaseService.updatePhotoAnalysis(
        Number.parseInt(photoId),
        {
          ...analysis,
          report,
          lastAnalyzed: new Date().toISOString(),
        },
        "completed"
      )
    }

    return NextResponse.json({
      success: true,
      analysis,
      report,
      filename,
      message: "Crop disease analysis completed successfully",
    })

  } catch (error: any) {
    console.error("[v0] Crop analysis error:", error)

    let statusCode = 500
    let errorMessage = "Analysis failed"

    if (error.message.includes("API key")) {
      statusCode = 401
      errorMessage = "Gemini API key not configured"
    } else if (error.message.includes("Invalid response")) {
      statusCode = 502
      errorMessage = "Gemini API service unavailable"
    } else if (error.message.includes("No JSON found")) {
      statusCode = 422
      errorMessage = "Unable to parse analysis response"
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: statusCode }
    )
  }
}

export async function GET(request: NextRequest) {
  console.log("[v0] Analysis history request received")

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId") || "1"
    const limit = Number(searchParams.get("limit")) || 10

    // Get analysis history from database
    const photos = await LocalDatabaseService.getUserPhotos(Number.parseInt(userId), limit)
    
    const analysisHistory = photos
      .filter(photo => photo.analysis_results)
      .map(photo => ({
        id: photo.id,
        filename: photo.filename,
        originalName: photo.original_name,
        uploadedAt: photo.created_at,
        analysisStatus: photo.analysis_status,
        analysisResults: photo.analysis_results,
        cropName: photo.analysis_results?.cropName,
        diseaseName: photo.analysis_results?.diseaseName,
        severity: photo.analysis_results?.severity,
        confidence: photo.analysis_results?.confidence,
      }))

    return NextResponse.json({
      success: true,
      analysisHistory,
      totalCount: analysisHistory.length,
      message: "Analysis history retrieved successfully",
    })

  } catch (error: any) {
    console.error("[v0] Analysis history error:", error)
    
    return NextResponse.json(
      {
        error: "Failed to retrieve analysis history",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

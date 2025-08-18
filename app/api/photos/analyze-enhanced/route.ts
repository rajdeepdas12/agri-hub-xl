import { type NextRequest, NextResponse } from "next/server"
import { analyzeCropDisease, generateAnalysisReport, batchAnalyzeCrops } from "@/lib/gemini-api"
import { LocalDatabaseService } from "@/lib/local-database"
import FileStorage from "@/lib/file-storage"

// Configure for large file uploads and extended processing time
export const maxDuration = 300 // 5 minutes
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  console.log("[v0] Enhanced crop analysis request received")

  // Check Gemini API key
  if (!process.env.GEMINI_API_KEY && !process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
    console.error("[v0] Gemini API key not configured")
    return NextResponse.json(
      { error: "Gemini API key not configured. Please set GEMINI_API_KEY or NEXT_PUBLIC_GEMINI_API_KEY in your environment variables." },
      { status: 500 }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const photoId = formData.get("photoId") as string
    const userId = (formData.get("userId") as string) || "1"
    const includeReport = formData.get("includeReport") === "true"
    const reportFormat = (formData.get("reportFormat") as string) || "text"

    if (!file && !photoId) {
      return NextResponse.json({ error: "Either file or photoId must be provided" }, { status: 400 })
    }

    let imagePath: string
    let filename: string

    if (file) {
      // Handle direct file upload
      const savedFile = await FileStorage.saveUploadedFile(file, "photos", Number.parseInt(userId))
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

    console.log("[v0] Analyzing image with enhanced Gemini 2.0 Flash:", imagePath)

    // Perform comprehensive crop disease analysis
    const analysis = await analyzeCropDisease(imagePath)
    
    // Generate detailed report if requested
    let report = null
    if (includeReport) {
      report = await generateAnalysisReport(analysis)
    }

    // Update database if photoId was provided
    if (photoId) {
      await LocalDatabaseService.updatePhotoAnalysis(
        Number.parseInt(photoId),
        {
          ...analysis,
          report,
          lastAnalyzed: new Date().toISOString(),
          analysisType: "enhanced_gemini_2_0_flash",
        },
        "completed"
      )
    }

    // Prepare response based on format
    const response: any = {
      success: true,
      analysis: {
        id: analysis.id,
        timestamp: analysis.timestamp,
        cropName: analysis.analysis.cropName,
        diseaseName: analysis.analysis.diseaseName,
        confidence: analysis.analysis.confidence,
        severity: analysis.analysis.severity,
        urgency: analysis.analysis.urgency,
        estimatedYieldLoss: analysis.analysis.estimatedYieldLoss,
        symptoms: analysis.analysis.symptoms,
        causes: analysis.analysis.causes,
        treatments: analysis.analysis.treatments,
        prevention: analysis.analysis.prevention,
        recommendations: analysis.analysis.recommendations,
        costOfTreatment: analysis.analysis.costOfTreatment,
      },
      imageInfo: analysis.imageInfo,
      environmentalFactors: analysis.environmentalFactors,
      filename,
      message: "Enhanced crop disease analysis completed successfully using Gemini 2.0 Flash",
    }

    if (report) {
      response.report = report
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error("[v0] Enhanced crop analysis error:", error)

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
    } else if (error.message.includes("Invalid analysis data")) {
      statusCode = 422
      errorMessage = "Invalid analysis data received"
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
  console.log("[v0] Enhanced analysis configuration request received")

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId") || "1"

    // Get enhanced analysis history from database
    const photos = await LocalDatabaseService.getUserPhotos(Number.parseInt(userId), 20)
    
    const enhancedAnalysisHistory = photos
      .filter(photo => photo.analysis_results && photo.analysis_results.analysisType === "enhanced_gemini_2_0_flash")
      .map(photo => ({
        id: photo.id,
        filename: photo.filename,
        originalName: photo.original_name,
        uploadedAt: photo.created_at,
        analyzedAt: photo.analysis_results?.lastAnalyzed,
        cropName: photo.analysis_results?.cropName,
        diseaseName: photo.analysis_results?.diseaseName,
        severity: photo.analysis_results?.severity,
        confidence: photo.analysis_results?.confidence,
        urgency: photo.analysis_results?.urgency,
        estimatedYieldLoss: photo.analysis_results?.estimatedYieldLoss,
        hasReport: !!photo.analysis_results?.report,
      }))

    return NextResponse.json({
      success: true,
      enhancedAnalysisHistory,
      totalCount: enhancedAnalysisHistory.length,
      message: "Enhanced analysis history retrieved successfully",
    })

  } catch (error: any) {
    console.error("[v0] Enhanced analysis history error:", error)
    
    return NextResponse.json(
      {
        error: "Failed to retrieve enhanced analysis history",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
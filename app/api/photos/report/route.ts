import { type NextRequest, NextResponse } from "next/server"
import { generateAnalysisReport } from "@/lib/gemini-api"
import { LocalDatabaseService } from "@/lib/local-database"

export async function POST(request: NextRequest) {
  console.log("[v0] Report generation request received")

  try {
    const body = await request.json()
    const { photoId, format = "text" } = body

    if (!photoId) {
      return NextResponse.json({ error: "Photo ID required" }, { status: 400 })
    }

    // Get photo from database
    const photo = await LocalDatabaseService.getPhotoById(Number.parseInt(photoId))
    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 })
    }

    if (!photo.analysis_results) {
      return NextResponse.json({ error: "Photo has not been analyzed yet" }, { status: 400 })
    }

    // Generate report based on format
    let reportContent: string
    let contentType: string
    let filename: string

    if (format === "json") {
      reportContent = JSON.stringify(photo.analysis_results, null, 2)
      contentType = "application/json"
      filename = `${photo.filename}_analysis.json`
    } else if (format === "pdf") {
      // For PDF generation, you would integrate with a library like puppeteer or jsPDF
      // For now, return text format
      reportContent = photo.analysis_results.report || "Report not available"
      contentType = "text/plain"
      filename = `${photo.filename}_analysis.txt`
    } else {
      // Default to text format
      reportContent = photo.analysis_results.report || "Report not available"
      contentType = "text/plain"
      filename = `${photo.filename}_analysis.txt`
    }

    // Create response with appropriate headers for download
    const response = new NextResponse(reportContent, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    })

    return response

  } catch (error: any) {
    console.error("[v0] Report generation error:", error)
    
    return NextResponse.json(
      {
        error: "Failed to generate report",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  console.log("[v0] Report template request received")

  try {
    const { searchParams } = new URL(request.url)
    const photoId = searchParams.get("photoId")

    if (!photoId) {
      return NextResponse.json({ error: "Photo ID required" }, { status: 400 })
    }

    // Get photo from database
    const photo = await LocalDatabaseService.getPhotoById(Number.parseInt(photoId))
    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 })
    }

    if (!photo.analysis_results) {
      return NextResponse.json({ error: "Photo has not been analyzed yet" }, { status: 400 })
    }

    // Return report preview (first 500 characters)
    const reportPreview = photo.analysis_results.report 
      ? photo.analysis_results.report.substring(0, 500) + "..."
      : "Report not available"

    return NextResponse.json({
      success: true,
      reportPreview,
      hasFullReport: !!photo.analysis_results.report,
      analysisSummary: {
        cropName: photo.analysis_results.cropName,
        diseaseName: photo.analysis_results.diseaseName,
        severity: photo.analysis_results.severity,
        confidence: photo.analysis_results.confidence,
        urgency: photo.analysis_results.urgency,
      },
      message: "Report preview retrieved successfully",
    })

  } catch (error: any) {
    console.error("[v0] Report preview error:", error)
    
    return NextResponse.json(
      {
        error: "Failed to retrieve report preview",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
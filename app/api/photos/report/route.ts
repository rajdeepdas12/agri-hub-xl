import { type NextRequest, NextResponse } from "next/server"
import { generateAnalysisReport } from "@/lib/gemini-api"
import { LocalDatabaseService } from "@/lib/local-database"

// Configure for dynamic responses
export const dynamic = 'force-dynamic'

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
      // Generate a simple PDF using pdf-lib
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib") as any
      const pdfDoc = await PDFDocument.create()
      let currentPage = pdfDoc.addPage([595.28, 841.89]) // A4 size in points
      let { width, height } = currentPage.getSize()

      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const title = "Crop Disease Analysis Report"
      const subtitle = `Photo: ${photo.original_name || photo.filename}`
      const analyzedAt = `Analyzed At: ${new Date(photo.updated_at || Date.now()).toLocaleString()}`

      let cursorY = height - 50
      currentPage.drawText(title, { x: 50, y: cursorY, size: 18, font, color: rgb(0, 0.45, 0) })
      cursorY -= 24
      currentPage.drawText(subtitle, { x: 50, y: cursorY, size: 12, font, color: rgb(0.2, 0.2, 0.2) })
      cursorY -= 18
      currentPage.drawText(analyzedAt, { x: 50, y: cursorY, size: 10, font, color: rgb(0.3, 0.3, 0.3) })

      cursorY -= 28
      const ar = photo.analysis_results
      const lines: string[] = []
      if (ar) {
        if (ar.cropName) lines.push(`Crop: ${ar.cropName}`)
        if (ar.diseaseName) lines.push(`Disease: ${ar.diseaseName}`)
        if (ar.severity) lines.push(`Severity: ${ar.severity}`)
        if (ar.confidence != null) lines.push(`Confidence: ${ar.confidence}%`)
        if (ar.urgency) lines.push(`Urgency: ${ar.urgency}`)
      }
      lines.push("")
      lines.push("Symptoms:")
      ;(ar?.symptoms || []).forEach((s: string) => lines.push(` • ${s}`))
      lines.push("")
      lines.push("Treatments:")
      ;(ar?.treatments || []).forEach((t: string) => lines.push(` • ${t}`))
      lines.push("")
      lines.push("Recommendations:")
      ;(ar?.recommendations || []).forEach((r: string) => lines.push(` • ${r}`))

      const maxWidth = width - 100
      const wrapText = (text: string, size = 11) => {
        const words = text.split(" ")
        let line = ""
        const wrapped: string[] = []
        for (const w of words) {
          const test = line ? `${line} ${w}` : w
          const wWidth = font.widthOfTextAtSize(test, size)
          if (wWidth > maxWidth) {
            if (line) wrapped.push(line)
            line = w
          } else {
            line = test
          }
        }
        if (line) wrapped.push(line)
        return wrapped
      }

      for (const text of lines) {
        const chunks = wrapText(text)
        for (const ch of chunks) {
          cursorY -= 14
          if (cursorY < 60) {
            // add new page
            currentPage = pdfDoc.addPage([595.28, 841.89])
            const size = currentPage.getSize()
            width = size.width
            height = size.height
            cursorY = height - 50
            currentPage.drawText("(continued)", { x: 50, y: cursorY, size: 10, font, color: rgb(0.5, 0.5, 0.5) })
            cursorY -= 18
          }
          currentPage.drawText(ch, { x: 50, y: cursorY, size: 11, font, color: rgb(0, 0, 0) })
        }
      }

      const pdfBytes = await pdfDoc.save()
      reportContent = Buffer.from(pdfBytes) as any
      contentType = "application/pdf"
      filename = `${photo.filename}_analysis.pdf`
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
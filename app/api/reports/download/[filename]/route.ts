import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { filename: string } }) {
  try {
    const { filename } = params

    const csvContent = `Date,Type,Value,Field,Notes
${new Date().toISOString()},Temperature,22.5°C,Field 1,Normal range
${new Date().toISOString()},Humidity,65%,Field 1,Optimal level
${new Date().toISOString()},Drone Flight,45min,Field 1,Crop monitoring mission
${new Date().toISOString()},Photo Analysis,Healthy,Field 1,No diseases detected`

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("[v0] Download error:", error)
    return NextResponse.json({ error: "Failed to download file" }, { status: 500 })
  }
}

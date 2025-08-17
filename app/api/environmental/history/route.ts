import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = Number.parseInt(searchParams.get("days") || "7")
    const hours = Number.parseInt(searchParams.get("hours") || "24")

    // Generate historical data for the requested period
    const historicalData = []
    const now = new Date()

    for (let i = hours - 1; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000)

      historicalData.push({
        timestamp: timestamp.toISOString(),
        temperature: 20 + Math.random() * 12,
        humidity: 55 + Math.random() * 30,
        windSpeed: 3 + Math.random() * 18,
        uvIndex: Math.floor(2 + Math.random() * 9),
        soilMoisture: 30 + Math.random() * 40,
        rainfall: Math.random() * 3,
      })
    }

    return NextResponse.json({
      data: historicalData,
      period: `${hours} hours`,
      totalRecords: historicalData.length,
    })
  } catch (error) {
    console.error("Error fetching environmental history:", error)
    return NextResponse.json({ error: "Failed to fetch environmental history" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // In a real implementation, this would fetch from weather APIs, IoT sensors, etc.
    // For now, we'll return realistic environmental data with some variation

    const baseData = {
      temperature: 22 + Math.random() * 8, // 22-30°C
      humidity: 60 + Math.random() * 25, // 60-85%
      windSpeed: 5 + Math.random() * 15, // 5-20 km/h
      uvIndex: Math.floor(3 + Math.random() * 8), // 3-10
      soilMoisture: 35 + Math.random() * 30, // 35-65%
      rainfall: Math.random() * 5, // 0-5mm
    }

    // Round values to reasonable precision
    const environmentalData = {
      temperature: Math.round(baseData.temperature * 10) / 10,
      humidity: Math.round(baseData.humidity),
      windSpeed: Math.round(baseData.windSpeed),
      uvIndex: baseData.uvIndex,
      soilMoisture: Math.round(baseData.soilMoisture),
      rainfall: Math.round(baseData.rainfall * 10) / 10,
      lastUpdated: new Date().toISOString(),
      location: "Field Sector A",
      alerts: [],
    }

    // Add alerts based on conditions
    if (environmentalData.temperature > 28) {
      environmentalData.alerts.push({
        type: "warning",
        message: "High temperature detected - consider irrigation",
      })
    }

    if (environmentalData.soilMoisture < 40) {
      environmentalData.alerts.push({
        type: "warning",
        message: "Low soil moisture - irrigation recommended",
      })
    }

    if (environmentalData.uvIndex > 7) {
      environmentalData.alerts.push({
        type: "info",
        message: "High UV index - protect crops if needed",
      })
    }

    return NextResponse.json(environmentalData)
  } catch (error) {
    console.error("Error fetching environmental data:", error)
    return NextResponse.json({ error: "Failed to fetch environmental data" }, { status: 500 })
  }
}

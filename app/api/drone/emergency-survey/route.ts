export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, priority = "high", area } = body

    const surveyData = {
      id: Date.now(),
      type: "emergency_survey",
      status: "initiated",
      priority,
      area: area || "Field A",
      estimatedDuration: "15 minutes",
      dronesAssigned: 2,
      timestamp: new Date().toISOString(),
    }

    console.log("[v0] Emergency survey initiated:", surveyData)

    return Response.json({
      success: true,
      message: "Emergency survey initiated successfully",
      data: surveyData,
    })
  } catch (error) {
    console.error("[v0] Emergency survey error:", error)
    return Response.json({ success: false, message: "Failed to initiate emergency survey" }, { status: 500 })
  }
}

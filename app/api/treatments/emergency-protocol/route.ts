export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { recommendationId, userId } = body

    const protocolData = {
      id: Date.now(),
      recommendationId,
      protocolType: "emergency",
      status: "activated",
      actions: [
        "Immediate pesticide application scheduled",
        "Quarantine area established",
        "Drone surveillance increased",
        "Expert consultation requested",
      ],
      priority: "critical",
      estimatedResponse: "2 hours",
      timestamp: new Date().toISOString(),
    }

    console.log("[v0] Emergency protocol activated:", protocolData)

    return Response.json({
      success: true,
      message: "Emergency protocol activated successfully",
      data: protocolData,
    })
  } catch (error) {
    console.error("[v0] Emergency protocol error:", error)
    return Response.json({ success: false, message: "Failed to activate emergency protocol" }, { status: 500 })
  }
}

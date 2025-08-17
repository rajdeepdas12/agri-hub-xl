import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = Number.parseInt(params.id)

    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    // Get user basic info
    const { rows: userRows } = await query(
      "SELECT id, username, first_name, last_name, farm_name FROM users WHERE id = $1",
      [userId],
    )

    if (userRows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = userRows[0]

    // Get fields count and total area
    const { rows: fieldsRows } = await query(
      "SELECT COUNT(*) as field_count, SUM(area_hectares) as total_area FROM fields WHERE user_id = $1",
      [userId],
    )

    const fieldsStats = fieldsRows[0]

    // Get photos count by source
    const { rows: photosRows } = await query(
      `SELECT 
         source,
         COUNT(*) as count,
         SUM(file_size) as total_size
       FROM photos 
       WHERE user_id = $1 
       GROUP BY source`,
      [userId],
    )

    const photosStats = photosRows.reduce(
      (acc, row) => {
        acc[row.source] = {
          count: Number.parseInt(row.count),
          totalSize: Number.parseInt(row.total_size) || 0,
        }
        return acc
      },
      {} as Record<string, { count: number; totalSize: number }>,
    )

    // Get drone flights statistics
    const { rows: droneRows } = await query(
      `SELECT 
         COUNT(*) as total_flights,
         SUM(flight_duration) as total_flight_time,
         SUM(area_covered) as total_area_covered,
         SUM(photos_taken) as total_photos_taken,
         COUNT(DISTINCT drone_id) as unique_drones
       FROM drone_data 
       WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '30 days'`,
      [userId],
    )

    const droneStats = droneRows[0]

    // Get recent security events
    const { rows: securityRows } = await query(
      `SELECT 
         COUNT(*) as total_events,
         COUNT(*) FILTER (WHERE status = 'open') as open_events,
         COUNT(*) FILTER (WHERE severity = 'high' OR severity = 'critical') as high_priority_events
       FROM security_events 
       WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '30 days'`,
      [userId],
    )

    const securityStats = securityRows[0]

    // Get recent activity (last 10 items)
    const { rows: activityRows } = await query(
      `(SELECT 'photo' as type, 'Photo uploaded' as activity, filename as details, created_at FROM photos WHERE user_id = $1)
       UNION ALL
       (SELECT 'drone' as type, 'Flight completed' as activity, flight_id as details, created_at FROM drone_data WHERE user_id = $1)
       UNION ALL
       (SELECT 'security' as type, 'Security event' as activity, event_type as details, created_at FROM security_events WHERE user_id = $1)
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId],
    )

    // Get crop health summary from recent photo analysis
    const { rows: healthRows } = await query(
      `SELECT 
         analysis_results
       FROM photos 
       WHERE user_id = $1 
         AND analysis_results IS NOT NULL 
         AND created_at >= NOW() - INTERVAL '7 days'
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId],
    )

    // Calculate average health score
    let avgHealthScore = 0
    let healthyFields = 0
    let stressedFields = 0
    let diseasedFields = 0

    if (healthRows.length > 0) {
      const healthScores = healthRows
        .map((row) => {
          try {
            const analysis =
              typeof row.analysis_results === "string" ? JSON.parse(row.analysis_results) : row.analysis_results
            return analysis?.colorAnalysis?.healthScore || 0
          } catch {
            return 0
          }
        })
        .filter((score) => score > 0)

      if (healthScores.length > 0) {
        avgHealthScore = Math.round(healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length)

        healthScores.forEach((score) => {
          if (score > 70) healthyFields++
          else if (score > 40) stressedFields++
          else diseasedFields++
        })
      }
    }

    return NextResponse.json({
      success: true,
      dashboard: {
        user: {
          id: user.id,
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          farmName: user.farm_name,
        },
        overview: {
          fields: {
            count: Number.parseInt(fieldsStats.field_count) || 0,
            totalArea: Number.parseFloat(fieldsStats.total_area) || 0,
          },
          photos: {
            upload: photosStats.upload || { count: 0, totalSize: 0 },
            drone: photosStats.drone || { count: 0, totalSize: 0 },
            satellite: photosStats.satellite || { count: 0, totalSize: 0 },
            total: Object.values(photosStats).reduce((sum, stat) => sum + stat.count, 0),
          },
          drone: {
            totalFlights: Number.parseInt(droneStats.total_flights) || 0,
            totalFlightTime: Number.parseInt(droneStats.total_flight_time) || 0,
            totalAreaCovered: Number.parseFloat(droneStats.total_area_covered) || 0,
            totalPhotosTaken: Number.parseInt(droneStats.total_photos_taken) || 0,
            uniqueDrones: Number.parseInt(droneStats.unique_drones) || 0,
          },
          security: {
            totalEvents: Number.parseInt(securityStats.total_events) || 0,
            openEvents: Number.parseInt(securityStats.open_events) || 0,
            highPriorityEvents: Number.parseInt(securityStats.high_priority_events) || 0,
          },
          cropHealth: {
            averageScore: avgHealthScore,
            healthy: healthyFields,
            stressed: stressedFields,
            diseased: diseasedFields,
            status: avgHealthScore > 70 ? "healthy" : avgHealthScore > 40 ? "stressed" : "needs_attention",
          },
        },
        recentActivity: activityRows.map((row) => ({
          type: row.type,
          activity: row.activity,
          details: row.details,
          timestamp: row.created_at,
        })),
      },
    })
  } catch (error) {
    console.error("[v0] Dashboard data error:", error)
    return NextResponse.json({ error: "Failed to get dashboard data" }, { status: 500 })
  }
}

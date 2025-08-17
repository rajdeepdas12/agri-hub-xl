import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { DatabaseService } from "@/lib/database"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any

    // Get fresh user data
    const user = await DatabaseService.getUserById(decoded.userId)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Remove password hash from response
    const { password_hash, ...userResponse } = user

    return NextResponse.json({
      success: true,
      valid: true,
      user: {
        id: userResponse.id,
        email: userResponse.email,
        username: userResponse.username,
        firstName: userResponse.first_name,
        lastName: userResponse.last_name,
        phone: userResponse.phone,
        role: userResponse.role,
        farmName: userResponse.farm_name,
        farmLocation: userResponse.farm_location,
        createdAt: userResponse.created_at,
      },
    })
  } catch (error) {
    console.error("[v0] Token verification error:", error)
    return NextResponse.json({ error: "Invalid token", valid: false }, { status: 401 })
  }
}

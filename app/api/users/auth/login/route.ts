import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Get user by email
    const user = await DatabaseService.getUserByEmail(email)

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)

    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    )

    // Remove password hash from response
    const { password_hash, ...userResponse } = user

    return NextResponse.json({
      success: true,
      token,
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
    console.error("[v0] Login error:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}

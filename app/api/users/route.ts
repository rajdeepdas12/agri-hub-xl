import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, username, password, firstName, lastName, phone, farmName, farmLocation } = body

    if (!email || !username || !password) {
      return NextResponse.json({ error: "Email, username, and password are required" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await DatabaseService.getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    // Hash password
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Create user
    const userData = {
      email,
      username,
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName,
      phone,
      role: "user",
      farm_name: farmName,
      farm_location: farmLocation,
    }

    const user = await DatabaseService.createUser(userData)

    // Remove password hash from response
    const { password_hash, ...userResponse } = user

    return NextResponse.json({
      success: true,
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
    console.error("[v0] User creation error:", error)
    return NextResponse.json(
      { error: "Failed to create user", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

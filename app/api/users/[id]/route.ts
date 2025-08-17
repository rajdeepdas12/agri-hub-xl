import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService, query } from "@/lib/database"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = Number.parseInt(params.id)

    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    const user = await DatabaseService.getUserById(userId)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

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
        updatedAt: userResponse.updated_at,
      },
    })
  } catch (error) {
    console.error("[v0] Get user error:", error)
    return NextResponse.json({ error: "Failed to get user" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = Number.parseInt(params.id)
    const body = await request.json()

    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    const updateFields = []
    const updateValues = []
    let paramIndex = 1

    // Build dynamic update query
    const allowedFields = {
      firstName: "first_name",
      lastName: "last_name",
      phone: "phone",
      farmName: "farm_name",
      farmLocation: "farm_location",
    }

    for (const [bodyField, dbField] of Object.entries(allowedFields)) {
      if (body[bodyField] !== undefined) {
        updateFields.push(`${dbField} = $${paramIndex}`)
        updateValues.push(body[bodyField])
        paramIndex++
      }
    }

    // Handle password update separately
    if (body.password) {
      const saltRounds = 12
      const passwordHash = await bcrypt.hash(body.password, saltRounds)
      updateFields.push(`password_hash = $${paramIndex}`)
      updateValues.push(passwordHash)
      paramIndex++
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`)
    updateValues.push(userId)

    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(", ")} 
      WHERE id = $${paramIndex}
      RETURNING id, email, username, first_name, last_name, phone, role, farm_name, farm_location, created_at, updated_at
    `

    const { rows } = await query(updateQuery, updateValues)
    const updatedUser = rows[0]

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        phone: updatedUser.phone,
        role: updatedUser.role,
        farmName: updatedUser.farm_name,
        farmLocation: updatedUser.farm_location,
        createdAt: updatedUser.created_at,
        updatedAt: updatedUser.updated_at,
      },
    })
  } catch (error) {
    console.error("[v0] Update user error:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = Number.parseInt(params.id)

    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    // Delete user (cascade will handle related records)
    const { rowCount } = await query("DELETE FROM users WHERE id = $1", [userId])

    if (rowCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    })
  } catch (error) {
    console.error("[v0] Delete user error:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}

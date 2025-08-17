import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = Number.parseInt(params.id)
    const body = await request.json()

    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    const { name, areaHectares, cropType, plantingDate, harvestDate, locationCoordinates, soilType, irrigationType } =
      body

    if (!name) {
      return NextResponse.json({ error: "Field name is required" }, { status: 400 })
    }

    const fieldData = {
      user_id: userId,
      name,
      area_hectares: areaHectares,
      crop_type: cropType,
      planting_date: plantingDate ? new Date(plantingDate) : null,
      harvest_date: harvestDate ? new Date(harvestDate) : null,
      location_coordinates: locationCoordinates,
      soil_type: soilType,
      irrigation_type: irrigationType,
    }

    const field = await DatabaseService.createField(fieldData)

    return NextResponse.json({
      success: true,
      field: {
        id: field.id,
        userId: field.user_id,
        name: field.name,
        areaHectares: field.area_hectares,
        cropType: field.crop_type,
        plantingDate: field.planting_date,
        harvestDate: field.harvest_date,
        locationCoordinates: field.location_coordinates,
        soilType: field.soil_type,
        irrigationType: field.irrigation_type,
        createdAt: field.created_at,
        updatedAt: field.updated_at,
      },
    })
  } catch (error) {
    console.error("[v0] Field creation error:", error)
    return NextResponse.json({ error: "Failed to create field" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = Number.parseInt(params.id)

    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    const fields = await DatabaseService.getFieldsByUser(userId)

    const fieldsResponse = fields.map((field) => ({
      id: field.id,
      userId: field.user_id,
      name: field.name,
      areaHectares: field.area_hectares,
      cropType: field.crop_type,
      plantingDate: field.planting_date,
      harvestDate: field.harvest_date,
      locationCoordinates: field.location_coordinates,
      soilType: field.soil_type,
      irrigationType: field.irrigation_type,
      createdAt: field.created_at,
      updatedAt: field.updated_at,
    }))

    return NextResponse.json({
      success: true,
      fields: fieldsResponse,
      count: fieldsResponse.length,
    })
  } catch (error) {
    console.error("[v0] Get user fields error:", error)
    return NextResponse.json({ error: "Failed to get fields" }, { status: 500 })
  }
}

import { Pool } from "pg"

// Database connection configuration
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
  : null

// Database query wrapper with error handling
export async function query(text: string, params?: any[]) {
  if (!pool) {
    throw new Error("Database not configured - DATABASE_URL environment variable is missing")
  }

  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    console.log("[v0] Database query executed", { text, duration, rows: res.rowCount })
    return res
  } catch (error) {
    console.error("[v0] Database query error:", error)
    throw error
  }
}

// Transaction wrapper
export async function transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    const result = await callback(client)
    await client.query("COMMIT")
    return result
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

// Database models and types
export interface User {
  id: number
  email: string
  username: string
  first_name?: string
  last_name?: string
  phone?: string
  role: string
  farm_name?: string
  farm_location?: string
  created_at: Date
  updated_at: Date
}

export interface Field {
  id: number
  user_id: number
  name: string
  area_hectares?: number
  crop_type?: string
  planting_date?: Date
  harvest_date?: Date
  location_coordinates?: string
  soil_type?: string
  irrigation_type?: string
  created_at: Date
  updated_at: Date
}

export interface Photo {
  id: number
  user_id: number
  field_id?: number
  filename: string
  original_name?: string
  file_path: string
  file_size?: number
  mime_type?: string
  source: "upload" | "drone" | "satellite"
  capture_date?: Date
  gps_latitude?: number
  gps_longitude?: number
  altitude?: number
  analysis_status: string
  analysis_results?: any
  tags?: string[]
  created_at: Date
}

export interface DroneData {
  id: number
  user_id: number
  field_id?: number
  drone_id?: string
  flight_id: string
  mission_type?: string
  start_time?: Date
  end_time?: Date
  flight_duration?: number
  battery_start?: number
  battery_end?: number
  weather_conditions?: any
  flight_path?: any
  altitude_avg?: number
  speed_avg?: number
  area_covered?: number
  photos_taken: number
  status: string
  notes?: string
  created_at: Date
}

export interface SecurityEvent {
  id: number
  user_id: number
  field_id?: number
  event_type: string
  severity: "low" | "medium" | "high" | "critical"
  description?: string
  location_coordinates?: string
  detection_method?: string
  photo_evidence?: number
  status: string
  response_actions?: string
  resolved_at?: Date
  created_at: Date
}

// Database utility functions
export class DatabaseService {
  // User operations
  static async createUser(userData: Partial<User>): Promise<User> {
    const { rows } = await query(
      `INSERT INTO users (email, username, password_hash, first_name, last_name, phone, role, farm_name, farm_location)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        userData.email,
        userData.username,
        userData.password_hash,
        userData.first_name,
        userData.last_name,
        userData.phone,
        userData.role || "user",
        userData.farm_name,
        userData.farm_location,
      ],
    )
    return rows[0]
  }

  static async getUserById(id: number): Promise<User | null> {
    const { rows } = await query("SELECT * FROM users WHERE id = $1", [id])
    return rows[0] || null
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const { rows } = await query("SELECT * FROM users WHERE email = $1", [email])
    return rows[0] || null
  }

  // Photo operations
  static async savePhoto(photoData: Partial<Photo>): Promise<Photo> {
    console.log("[v0] Saving photo to database:", photoData)

    try {
      const { rows } = await query(
        `INSERT INTO photos (user_id, field_id, filename, original_name, file_path, file_size, 
         mime_type, source, capture_date, gps_latitude, gps_longitude, altitude, analysis_status, analysis_results, tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         RETURNING *`,
        [
          photoData.user_id,
          photoData.field_id,
          photoData.filename,
          photoData.original_name,
          photoData.file_path,
          photoData.file_size,
          photoData.mime_type,
          photoData.source,
          photoData.capture_date,
          photoData.gps_latitude,
          photoData.gps_longitude,
          photoData.altitude,
          photoData.analysis_status || "pending", // Added analysis_status with default
          photoData.analysis_results ? JSON.stringify(photoData.analysis_results) : null, // Added analysis_results with JSON conversion
          photoData.tags,
        ],
      )

      console.log("[v0] Photo saved successfully:", rows[0])
      return rows[0]
    } catch (error) {
      console.error("[v0] Database error saving photo:", error)

      if (error instanceof Error && error.message.includes('relation "photos" does not exist')) {
        throw new Error("Database tables not initialized. Please run the database setup script first.")
      }

      throw new Error(`Failed to save photo to database: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  static async getPhotosByUser(userId: number, limit = 50): Promise<Photo[]> {
    const { rows } = await query("SELECT * FROM photos WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2", [
      userId,
      limit,
    ])
    return rows
  }

  static async getPhotosByField(fieldId: number): Promise<Photo[]> {
    const { rows } = await query("SELECT * FROM photos WHERE field_id = $1 ORDER BY created_at DESC", [fieldId])
    return rows
  }

  static async updatePhotoAnalysis(
    photoId: number,
    analysisResults: any,
    analysisStatus = "completed",
  ): Promise<Photo> {
    console.log("[v0] Updating photo analysis:", { photoId, analysisStatus })

    try {
      const { rows } = await query(
        `UPDATE photos SET analysis_results = $1, analysis_status = $2, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $3 RETURNING *`,
        [JSON.stringify(analysisResults), analysisStatus, photoId],
      )

      if (rows.length === 0) {
        throw new Error(`Photo with ID ${photoId} not found`)
      }

      console.log("[v0] Photo analysis updated successfully")
      return rows[0]
    } catch (error) {
      console.error("[v0] Database error updating photo analysis:", error)
      throw new Error(`Failed to update photo analysis: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  static async getPhotoById(photoId: number): Promise<Photo | null> {
    console.log("[v0] Getting photo by ID:", photoId)

    try {
      const { rows } = await query("SELECT * FROM photos WHERE id = $1", [photoId])
      return rows[0] || null
    } catch (error) {
      console.error("[v0] Database error getting photo:", error)
      throw new Error(`Failed to get photo: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  static async getRecentPhotos(userId: number, limit = 10): Promise<Photo[]> {
    console.log("[v0] Getting recent photos for user:", userId, "limit:", limit)

    try {
      const { rows } = await query("SELECT * FROM photos WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2", [
        userId,
        limit,
      ])

      console.log("[v0] Retrieved", rows.length, "recent photos from database")
      return rows
    } catch (error) {
      console.error("[v0] Database error getting recent photos:", error)

      if (error instanceof Error && error.message.includes('relation "photos" does not exist')) {
        throw new Error("Database tables not initialized. Please run the database setup script first.")
      }

      throw new Error(`Failed to get recent photos: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  // Drone data operations
  static async saveDroneData(droneData: Partial<DroneData>): Promise<DroneData> {
    const { rows } = await query(
      `INSERT INTO drone_data (user_id, field_id, drone_id, flight_id, mission_type, 
       start_time, end_time, flight_duration, battery_start, battery_end, weather_conditions,
       flight_path, altitude_avg, speed_avg, area_covered, photos_taken, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       RETURNING *`,
      [
        droneData.user_id,
        droneData.field_id,
        droneData.drone_id,
        droneData.flight_id,
        droneData.mission_type,
        droneData.start_time,
        droneData.end_time,
        droneData.flight_duration,
        droneData.battery_start,
        droneData.battery_end,
        droneData.weather_conditions,
        droneData.flight_path,
        droneData.altitude_avg,
        droneData.speed_avg,
        droneData.area_covered,
        droneData.photos_taken,
        droneData.status,
        droneData.notes,
      ],
    )
    return rows[0]
  }

  static async getDroneDataByUser(userId: number): Promise<DroneData[]> {
    const { rows } = await query("SELECT * FROM drone_data WHERE user_id = $1 ORDER BY created_at DESC", [userId])
    return rows
  }

  // Field operations
  static async createField(fieldData: Partial<Field>): Promise<Field> {
    const { rows } = await query(
      `INSERT INTO fields (user_id, name, area_hectares, crop_type, planting_date, 
       harvest_date, location_coordinates, soil_type, irrigation_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        fieldData.user_id,
        fieldData.name,
        fieldData.area_hectares,
        fieldData.crop_type,
        fieldData.planting_date,
        fieldData.harvest_date,
        fieldData.location_coordinates,
        fieldData.soil_type,
        fieldData.irrigation_type,
      ],
    )
    return rows[0]
  }

  static async getFieldsByUser(userId: number): Promise<Field[]> {
    const { rows } = await query("SELECT * FROM fields WHERE user_id = $1 ORDER BY created_at DESC", [userId])
    return rows
  }

  // Security event operations
  static async createSecurityEvent(eventData: Partial<SecurityEvent>): Promise<SecurityEvent> {
    const { rows } = await query(
      `INSERT INTO security_events (user_id, field_id, event_type, severity, description,
       location_coordinates, detection_method, photo_evidence, status, response_actions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        eventData.user_id,
        eventData.field_id,
        eventData.event_type,
        eventData.severity,
        eventData.description,
        eventData.location_coordinates,
        eventData.detection_method,
        eventData.photo_evidence,
        eventData.status || "open",
        eventData.response_actions,
      ],
    )
    return rows[0]
  }

  static async getSecurityEventsByUser(userId: number): Promise<SecurityEvent[]> {
    const { rows } = await query("SELECT * FROM security_events WHERE user_id = $1 ORDER BY created_at DESC", [userId])
    return rows
  }
}

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    if (!pool) {
      console.error("[v0] Database not configured - DATABASE_URL environment variable is missing")
      return false
    }

    const { rows } = await query("SELECT NOW() as current_time")
    console.log("[v0] Database connection successful:", rows[0])
    return true
  } catch (error) {
    console.error("[v0] Database connection failed:", error)
    return false
  }
}

export default pool

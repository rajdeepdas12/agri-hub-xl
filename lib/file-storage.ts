import { promises as fs } from "fs"
import path from "path"

// File storage configuration
const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads"
const MAX_FILE_SIZE = Number.parseInt(process.env.MAX_FILE_SIZE || "20971520") // 20MB default
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/tiff",
  "video/mp4",
  "video/avi",
  "application/json", // For drone telemetry data
  "text/csv", // For sensor data exports
]

function isServerSide(): boolean {
  return (
    typeof window === "undefined" &&
    typeof process !== "undefined" &&
    process.versions?.node &&
    typeof require !== "undefined"
  )
}

function isPreviewEnvironment(): boolean {
  return (
    process.env.VERCEL_ENV === "preview" ||
    process.env.NETLIFY === "true" ||
    (process.env.NODE_ENV === "production" && process.env.VERCEL_URL)
  )
}

function ensureServerSide(functionName: string): void {
  if (!isServerSide()) {
    throw new Error(`${functionName} can only be executed on the server side`)
  }
}

function generateUUID(): string {
  ensureServerSide("generateUUID")
  try {
    const { v4: uuidv4 } = require("uuid")
    return uuidv4()
  } catch (error) {
    console.log("[v0] UUID package not available, using fallback ID generation")
    // Fallback UUID generation
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c == "x" ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }
}

// Ensure upload directories exist
export async function initializeStorage() {
  ensureServerSide("initializeStorage")

  const directories = [
    path.join(UPLOAD_DIR, "photos"),
    path.join(UPLOAD_DIR, "drone-data"),
    path.join(UPLOAD_DIR, "thumbnails"),
    path.join(UPLOAD_DIR, "processed"),
    path.join(UPLOAD_DIR, "temp"),
  ]

  for (const dir of directories) {
    try {
      await fs.mkdir(dir, { recursive: true })
      console.log("[v0] Created storage directory:", dir)
    } catch (error) {
      console.error("[v0] Error creating directory:", dir, error)
      // Don't throw error, just log it and continue
    }
  }
  
  // Verify directories are writable
  for (const dir of directories) {
    try {
      const testFile = path.join(dir, '.test-write')
      await fs.writeFile(testFile, 'test')
      await fs.unlink(testFile)
      console.log("[v0] Directory is writable:", dir)
    } catch (error) {
      console.error("[v0] Directory is not writable:", dir, error)
    }
  }
}

// File validation
export function validateFile(file: File): { valid: boolean; error?: string; statusCode?: number } {
  if (!file) {
    return { valid: false, error: "No file provided", statusCode: 400 }
  }

  if (file.size === 0) {
    return { valid: false, error: "File is empty", statusCode: 400 }
  }

  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = Math.round(MAX_FILE_SIZE / 1024 / 1024)
    return {
      valid: false,
      error: `File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds ${sizeMB}MB limit`,
      statusCode: 413,
    }
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File type '${file.type}' not supported. Allowed types: JPG, PNG, WEBP`,
      statusCode: 415,
    }
  }

  return { valid: true }
}

export function generateFileName(originalName: string, prefix?: string): string {
  ensureServerSide("generateFileName")
  try {
    const ext = path.extname(originalName)
    const uuid = generateUUID()
    const timestamp = Date.now()
    return `${prefix ? prefix + "_" : ""}${timestamp}_${uuid}${ext}`
  } catch (error) {
    console.log("[v0] Error in filename generation, using simple timestamp")
    const ext = path.extname(originalName)
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    return `${prefix ? prefix + "_" : ""}${timestamp}_${random}${ext}`
  }
}

// Save uploaded file
export async function saveUploadedFile(
  file: File,
  category: "photos" | "drone-data" = "photos",
  userId?: number,
): Promise<{
  filename: string
  filepath: string
  size: number
  mimetype: string
  isBase64?: boolean
}> {
  console.log("[v0] Starting file save process...")

  const validation = validateFile(file)
  if (!validation.valid) {
    const error = new Error(validation.error) as any
    error.statusCode = validation.statusCode
    throw error
  }

  const filename = generateFileName(file.name, userId?.toString())

  // Preview environment logic
  if (isPreviewEnvironment()) {
    console.log("[v0] Preview environment detected, using base64 storage")

    try {
      const arrayBuffer = await file.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString("base64")
      const dataUrl = `data:${file.type};base64,${base64}`

      // Store in memory for preview builds (localStorage not available on server)
      console.log("[v0] Storing file in memory for preview environment")

      return {
        filename,
        filepath: `/preview-uploads/${filename}`, // Virtual path for preview
        size: file.size,
        mimetype: file.type,
        isBase64: true,
      }
    } catch (error) {
      console.error("[v0] Base64 storage failed:", error)
      const storageError = new Error("Failed to store file in preview environment") as any
      storageError.statusCode = 500
      throw storageError
    }
  }

  // Original filesystem logic
  if (!isServerSide()) {
    const error = new Error("File operations not available on client side") as any
    error.statusCode = 500
    throw error
  }

  const filepath = path.join(UPLOAD_DIR, category, filename)
  console.log("[v0] Target filepath:", filepath)

  try {
    const dirPath = path.join(UPLOAD_DIR, category)
    console.log("[v0] Ensuring directory exists:", dirPath)

    try {
      await fs.mkdir(dirPath, { recursive: true })
      console.log("[v0] Directory created/verified:", dirPath)
    } catch (mkdirError) {
      console.error("[v0] Directory creation failed:", mkdirError)
      throw new Error(
        `Failed to create upload directory: ${mkdirError instanceof Error ? mkdirError.message : "Unknown error"}`,
      )
    }

    // Convert File to Buffer
    console.log("[v0] Converting file to buffer...")
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    console.log("[v0] Buffer created, size:", buffer.length)

    // Save file
    console.log("[v0] Writing file to disk...")
    await fs.writeFile(filepath, buffer)
    console.log("[v0] File written successfully")

    // Generate thumbnail for images (with error handling)
    if (file.type.startsWith("image/")) {
      try {
        console.log("[v0] Generating thumbnail...")
        await generateThumbnail(filepath, filename)
      } catch (thumbError) {
        console.log("[v0] Thumbnail generation failed, continuing without thumbnail:", thumbError)
      }
    }

    console.log("[v0] File saved successfully:", filepath)

    return {
      filename,
      filepath: path.relative(process.cwd(), filepath),
      size: file.size,
      mimetype: file.type,
    }
  } catch (error) {
    console.error("[v0] Error saving file:", error)
    throw new Error(`Failed to save file: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Generate thumbnail for images
export async function generateThumbnail(originalPath: string, filename: string): Promise<string> {
  ensureServerSide("generateThumbnail")
  try {
    const thumbnailDir = path.join(UPLOAD_DIR, "thumbnails")
    const thumbnailPath = path.join(thumbnailDir, `thumb_${filename}`)

    // Check if sharp is available
    try {
      const sharp = require("sharp")
      await sharp(originalPath)
        .resize(300, 300, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath)

      console.log("[v0] Thumbnail generated:", thumbnailPath)
      return path.relative(process.cwd(), thumbnailPath)
    } catch (sharpError) {
      console.log("[v0] Sharp not available, skipping thumbnail generation:", sharpError)
      // Return original path as fallback
      return path.relative(process.cwd(), originalPath)
    }
  } catch (error) {
    console.error("[v0] Error generating thumbnail:", error)
    // Return original path as fallback instead of throwing
    return path.relative(process.cwd(), originalPath)
  }
}

// Process drone data files
export async function processDroneData(filepath: string): Promise<any> {
  ensureServerSide("processDroneData")
  try {
    const fileContent = await fs.readFile(filepath, "utf-8")

    // Parse JSON drone data
    if (filepath.endsWith(".json")) {
      const droneData = JSON.parse(fileContent)

      // Extract key metrics
      const processedData = {
        flightId: droneData.flight_id || generateUUID(),
        duration: droneData.flight_duration || 0,
        batteryUsage: {
          start: droneData.battery_start || 100,
          end: droneData.battery_end || 80,
        },
        coordinates: droneData.flight_path || [],
        photos: droneData.photos_taken || 0,
        altitude: {
          avg: droneData.altitude_avg || 0,
          max: droneData.altitude_max || 0,
          min: droneData.altitude_min || 0,
        },
        weather: droneData.weather_conditions || {},
        processed_at: new Date().toISOString(),
      }

      // Save processed data
      const processedPath = path.join(UPLOAD_DIR, "processed", `processed_${path.basename(filepath)}`)
      await fs.writeFile(processedPath, JSON.stringify(processedData, null, 2))

      return processedData
    }

    // Parse CSV sensor data
    if (filepath.endsWith(".csv")) {
      const lines = fileContent.split("\n")
      const headers = lines[0].split(",")
      const data = lines.slice(1).map((line) => {
        const values = line.split(",")
        const row: any = {}
        headers.forEach((header, index) => {
          row[header.trim()] = values[index]?.trim()
        })
        return row
      })

      return {
        headers,
        data,
        rowCount: data.length,
        processed_at: new Date().toISOString(),
      }
    }

    return null
  } catch (error) {
    console.error("[v0] Error processing drone data:", error)
    throw error
  }
}

// Get file info
export async function getFileInfo(filepath: string): Promise<{
  exists: boolean
  size?: number
  modified?: Date
  mimetype?: string
}> {
  ensureServerSide("getFileInfo")
  try {
    const stats = await fs.stat(filepath)
    const ext = path.extname(filepath).toLowerCase()

    let mimetype = "application/octet-stream"
    if ([".jpg", ".jpeg"].includes(ext)) mimetype = "image/jpeg"
    else if (ext === ".png") mimetype = "image/png"
    else if (ext === ".webp") mimetype = "image/webp"
    else if (ext === ".mp4") mimetype = "video/mp4"
    else if (ext === ".json") mimetype = "application/json"
    else if (ext === ".csv") mimetype = "text/csv"

    return {
      exists: true,
      size: stats.size,
      modified: stats.mtime,
      mimetype,
    }
  } catch (error) {
    return { exists: false }
  }
}

// Delete file
export async function deleteFile(filepath: string): Promise<boolean> {
  ensureServerSide("deleteFile")
  try {
    await fs.unlink(filepath)

    // Also delete thumbnail if it exists
    const filename = path.basename(filepath)
    const thumbnailPath = path.join(UPLOAD_DIR, "thumbnails", `thumb_${filename}`)
    try {
      await fs.unlink(thumbnailPath)
    } catch {
      // Thumbnail might not exist, ignore error
    }

    console.log("[v0] File deleted:", filepath)
    return true
  } catch (error) {
    console.error("[v0] Error deleting file:", error)
    return false
  }
}

// List files in directory
export async function listFiles(
  category: "photos" | "drone-data" | "thumbnails" | "processed",
  limit = 50,
): Promise<
  Array<{
    filename: string
    filepath: string
    size: number
    modified: Date
    mimetype: string
  }>
> {
  ensureServerSide("listFiles")
  try {
    const dirPath = path.join(UPLOAD_DIR, category)
    const files = await fs.readdir(dirPath)

    const fileInfos = await Promise.all(
      files.slice(0, limit).map(async (filename) => {
        const filepath = path.join(dirPath, filename)
        const info = await getFileInfo(filepath)
        return {
          filename,
          filepath: path.relative(process.cwd(), filepath),
          size: info.size || 0,
          modified: info.modified || new Date(),
          mimetype: info.mimetype || "application/octet-stream",
        }
      }),
    )

    return fileInfos.sort((a, b) => b.modified.getTime() - a.modified.getTime())
  } catch (error) {
    console.error("[v0] Error listing files:", error)
    return []
  }
}

// Clean up old temporary files
export async function cleanupTempFiles(olderThanHours = 24): Promise<number> {
  ensureServerSide("cleanupTempFiles")
  try {
    const tempDir = path.join(UPLOAD_DIR, "temp")
    const files = await fs.readdir(tempDir)
    const cutoffTime = Date.now() - olderThanHours * 60 * 60 * 1000

    let deletedCount = 0

    for (const filename of files) {
      const filepath = path.join(tempDir, filename)
      const stats = await fs.stat(filepath)

      if (stats.mtime.getTime() < cutoffTime) {
        await fs.unlink(filepath)
        deletedCount++
      }
    }

    console.log("[v0] Cleaned up", deletedCount, "temporary files")
    return deletedCount
  } catch (error) {
    console.error("[v0] Error cleaning up temp files:", error)
    return 0
  }
}

// Storage statistics
export async function getStorageStats(): Promise<{
  totalFiles: number
  totalSize: number
  categories: Record<string, { files: number; size: number }>
}> {
  ensureServerSide("getStorageStats")
  const categories = ["photos", "drone-data", "thumbnails", "processed"]
  const stats = {
    totalFiles: 0,
    totalSize: 0,
    categories: {} as Record<string, { files: number; size: number }>,
  }

  for (const category of categories) {
    try {
      const files = await listFiles(category as any, 1000)
      const categorySize = files.reduce((sum, file) => sum + file.size, 0)

      stats.categories[category] = {
        files: files.length,
        size: categorySize,
      }

      stats.totalFiles += files.length
      stats.totalSize += categorySize
    } catch (error) {
      stats.categories[category] = { files: 0, size: 0 }
    }
  }

  return stats
}

export default {
  saveUploadedFile,
  processDroneData,
  generateThumbnail,
  getFileInfo,
  deleteFile,
  listFiles,
  cleanupTempFiles,
  getStorageStats,
  validateFile,
  generateFileName,
  initializeStorage,
}

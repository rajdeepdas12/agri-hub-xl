// Local database implementation using in-memory storage with persistence
// This provides a self-contained database solution without external dependencies

interface LocalPhoto {
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

interface LocalUser {
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

class LocalDatabase {
  private photos: LocalPhoto[] = []
  private users: LocalUser[] = []
  private nextPhotoId = 1
  private nextUserId = 1

  constructor() {
    this.loadFromStorage()
    // Create default user if none exists
    if (this.users.length === 0) {
      this.createDefaultUser()
    }
  }

  private loadFromStorage() {
    try {
      // For server-side, we'll use in-memory storage only
      if (typeof window === "undefined") {
        console.log("[v0] Server-side local database - using in-memory storage")
        return
      }

      const photosData = localStorage.getItem("agrisecure_photos")
      const usersData = localStorage.getItem("agrisecure_users")
      const photoIdData = localStorage.getItem("agrisecure_next_photo_id")
      const userIdData = localStorage.getItem("agrisecure_next_user_id")

      if (photosData) {
        this.photos = JSON.parse(photosData).map((photo: any) => ({
          ...photo,
          created_at: new Date(photo.created_at),
          capture_date: photo.capture_date ? new Date(photo.capture_date) : undefined,
        }))
      }

      if (usersData) {
        this.users = JSON.parse(usersData).map((user: any) => ({
          ...user,
          created_at: new Date(user.created_at),
          updated_at: new Date(user.updated_at),
        }))
      }

      if (photoIdData) {
        this.nextPhotoId = Number.parseInt(photoIdData, 10)
      }

      if (userIdData) {
        this.nextUserId = Number.parseInt(userIdData, 10)
      }
    } catch (error) {
      console.error("[v0] Error loading from local storage:", error)
    }
  }

  private saveToStorage() {
    try {
      // For server-side, we'll skip localStorage operations
      if (typeof window === "undefined") {
        return
      }

      localStorage.setItem("agrisecure_photos", JSON.stringify(this.photos))
      localStorage.setItem("agrisecure_users", JSON.stringify(this.users))
      localStorage.setItem("agrisecure_next_photo_id", this.nextPhotoId.toString())
      localStorage.setItem("agrisecure_next_user_id", this.nextUserId.toString())
    } catch (error) {
      console.error("[v0] Error saving to local storage:", error)
    }
  }

  private createDefaultUser() {
    const defaultUser: LocalUser = {
      id: this.nextUserId++,
      email: "demo@agrisecure.com",
      username: "demo_user",
      first_name: "Demo",
      last_name: "User",
      role: "user",
      farm_name: "Demo Farm",
      farm_location: "Demo Location",
      created_at: new Date(),
      updated_at: new Date(),
    }
    this.users.push(defaultUser)
    this.saveToStorage()
  }

  // Photo operations
  async savePhoto(photoData: Partial<LocalPhoto>): Promise<LocalPhoto> {
    console.log("[v0] Saving photo to local database:", photoData)

    const photo: LocalPhoto = {
      id: this.nextPhotoId++,
      user_id: photoData.user_id || 1, // Default to first user
      field_id: photoData.field_id,
      filename: photoData.filename || "",
      original_name: photoData.original_name,
      file_path: photoData.file_path || "",
      file_size: photoData.file_size,
      mime_type: photoData.mime_type,
      source: photoData.source || "upload",
      capture_date: photoData.capture_date || new Date(),
      gps_latitude: photoData.gps_latitude,
      gps_longitude: photoData.gps_longitude,
      altitude: photoData.altitude,
      analysis_status: photoData.analysis_status || "pending",
      analysis_results: photoData.analysis_results,
      tags: photoData.tags,
      created_at: new Date(),
    }

    this.photos.push(photo)
    this.saveToStorage()

    console.log("[v0] Photo saved successfully to local database:", photo)
    return photo
  }

  async getRecentPhotos(userId = 1, limit = 10): Promise<LocalPhoto[]> {
    console.log("[v0] Getting recent photos from local database for user:", userId, "limit:", limit)

    const userPhotos = this.photos
      .filter((photo) => photo.user_id === userId)
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, limit)

    console.log("[v0] Retrieved", userPhotos.length, "recent photos from local database")
    return userPhotos
  }

  async getPhotoById(photoId: number): Promise<LocalPhoto | null> {
    const photo = this.photos.find((p) => p.id === photoId)
    return photo || null
  }

  async updatePhotoAnalysis(
    photoId: number,
    analysisResults: any,
    analysisStatus = "completed",
  ): Promise<LocalPhoto | null> {
    const photoIndex = this.photos.findIndex((p) => p.id === photoId)
    if (photoIndex === -1) {
      return null
    }

    this.photos[photoIndex] = {
      ...this.photos[photoIndex],
      analysis_results: analysisResults,
      analysis_status: analysisStatus,
    }

    this.saveToStorage()
    return this.photos[photoIndex]
  }

  // User operations
  async getUserById(id: number): Promise<LocalUser | null> {
    return this.users.find((user) => user.id === id) || null
  }

  async getUserByEmail(email: string): Promise<LocalUser | null> {
    return this.users.find((user) => user.email === email) || null
  }

  // Utility methods
  async checkConnection(): Promise<boolean> {
    console.log("[v0] Local database connection check - always available")
    return true
  }

  async clearAllData(): Promise<void> {
    this.photos = []
    this.users = []
    this.nextPhotoId = 1
    this.nextUserId = 1
    this.createDefaultUser()
    this.saveToStorage()
  }

  // Get statistics
  getStats() {
    return {
      totalPhotos: this.photos.length,
      totalUsers: this.users.length,
      pendingAnalysis: this.photos.filter((p) => p.analysis_status === "pending").length,
      completedAnalysis: this.photos.filter((p) => p.analysis_status === "completed").length,
    }
  }
}

// Create singleton instance
const localDB = new LocalDatabase()

// Export service class that matches the original DatabaseService interface
export class LocalDatabaseService {
  static async savePhoto(photoData: Partial<LocalPhoto>): Promise<LocalPhoto> {
    return localDB.savePhoto(photoData)
  }

  static async getRecentPhotos(userId = 1, limit = 10): Promise<LocalPhoto[]> {
    return localDB.getRecentPhotos(userId, limit)
  }

  static async getPhotoById(photoId: number): Promise<LocalPhoto | null> {
    return localDB.getPhotoById(photoId)
  }

  static async updatePhotoAnalysis(
    photoId: number,
    analysisResults: any,
    analysisStatus = "completed",
  ): Promise<LocalPhoto | null> {
    return localDB.updatePhotoAnalysis(photoId, analysisResults, analysisStatus)
  }

  static async getUserById(id: number): Promise<LocalUser | null> {
    return localDB.getUserById(id)
  }

  static async getUserByEmail(email: string): Promise<LocalUser | null> {
    return localDB.getUserByEmail(email)
  }
}

export async function checkLocalDatabaseConnection(): Promise<boolean> {
  return localDB.checkConnection()
}

export { localDB }
export default LocalDatabaseService

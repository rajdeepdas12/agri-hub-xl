export interface StoredData {
  id: string
  timestamp: number
  type: "environmental" | "photo" | "drone" | "analysis" | "sensor"
  data: any
  userId?: string
  metadata?: Record<string, any>
}

export interface EnvironmentalData {
  temperature: number
  humidity: number
  windSpeed: number
  uvIndex: number
  soilMoisture: number
  rainfall: number
  alerts: Array<{
    type: string
    message: string
    severity: "low" | "medium" | "high"
  }>
}

export interface PhotoData {
  id: string
  filename: string
  url: string
  analysisStatus: "pending" | "completed" | "failed"
  analysisResults?: any
  uploadedAt: number
  userId?: string
}

export interface DroneData {
  id: string
  flightId: string
  status: string
  battery: number
  location: { lat: number; lng: number }
  altitude: number
  speed: number
  timestamp: number
}

class DataStorageService {
  private storageKey = "agrisecure_data"
  private maxStorageSize = 50 // Maximum number of items per type
  private maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

  private initStorage(): StoredData[] {
    try {
      if (typeof window === 'undefined') return []
      const stored = localStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error("[v0] Error reading from localStorage:", error)
      return []
    }
  }

  private saveStorage(data: StoredData[]): void {
    try {
      if (typeof window === 'undefined') return
      // Clean old data before saving
      const cleanedData = this.cleanOldData(data)
      localStorage.setItem(this.storageKey, JSON.stringify(cleanedData))
    } catch (error) {
      console.error("[v0] Error saving to localStorage:", error)
    }
  }

  private cleanOldData(data: StoredData[]): StoredData[] {
    const now = Date.now()
    return data.filter((item) => now - item.timestamp < this.maxAge)
  }

  storeData(type: StoredData["type"], data: any, userId?: string, metadata?: Record<string, any>): string {
    const stored = this.initStorage()
    const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const newItem: StoredData = {
      id,
      timestamp: Date.now(),
      type,
      data,
      userId,
      metadata,
    }

    // Add new item
    stored.push(newItem)

    // Limit items per type
    const typeItems = stored.filter((item) => item.type === type)
    if (typeItems.length > this.maxStorageSize) {
      // Remove oldest items of this type
      const sortedTypeItems = typeItems.sort((a, b) => a.timestamp - b.timestamp)
      const itemsToRemove = sortedTypeItems.slice(0, typeItems.length - this.maxStorageSize)

      const filteredStored = stored.filter((item) => !itemsToRemove.some((removeItem) => removeItem.id === item.id))

      this.saveStorage(filteredStored)
    } else {
      this.saveStorage(stored)
    }

    return id
  }

  getData(type: StoredData["type"], limit?: number, userId?: string): StoredData[] {
    const stored = this.initStorage()
    let filtered = stored.filter((item) => item.type === type)

    if (userId) {
      filtered = filtered.filter((item) => item.userId === userId)
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp - a.timestamp)

    return limit ? filtered.slice(0, limit) : filtered
  }

  getDataById(id: string): StoredData | null {
    const stored = this.initStorage()
    return stored.find((item) => item.id === id) || null
  }

  updateData(id: string, newData: any, metadata?: Record<string, any>): boolean {
    const stored = this.initStorage()
    const index = stored.findIndex((item) => item.id === id)

    if (index !== -1) {
      stored[index].data = newData
      stored[index].timestamp = Date.now()
      if (metadata) {
        stored[index].metadata = { ...stored[index].metadata, ...metadata }
      }
      this.saveStorage(stored)
      return true
    }
    return false
  }

  deleteData(id: string): boolean {
    const stored = this.initStorage()
    const filtered = stored.filter((item) => item.id !== id)

    if (filtered.length !== stored.length) {
      this.saveStorage(filtered)
      return true
    }
    return false
  }

  clearDataType(type: StoredData["type"]): void {
    const stored = this.initStorage()
    const filtered = stored.filter((item) => item.type !== type)
    this.saveStorage(filtered)
  }

  getStorageStats(): Record<string, number> {
    const stored = this.initStorage()
    const stats: Record<string, number> = {}

    stored.forEach((item) => {
      stats[item.type] = (stats[item.type] || 0) + 1
    })

    return stats
  }

  storeEnvironmentalData(data: EnvironmentalData, userId?: string): string {
    return this.storeData("environmental", data, userId, {
      location: "field_1", // Could be dynamic
      source: "sensor_network",
    })
  }

  getRecentEnvironmentalData(limit = 10, userId?: string): EnvironmentalData[] {
    return this.getData("environmental", limit, userId).map((item) => item.data)
  }

  storePhotoData(data: PhotoData, userId?: string): string {
    return this.storeData("photo", data, userId, {
      fileSize: data.metadata?.fileSize,
      dimensions: data.metadata?.dimensions,
    })
  }

  getRecentPhotos(limit = 20, userId?: string): PhotoData[] {
    return this.getData("photo", limit, userId).map((item) => item.data)
  }

  storeDroneData(data: DroneData, userId?: string): string {
    return this.storeData("drone", data, userId, {
      mission: data.metadata?.mission,
      operator: data.metadata?.operator,
    })
  }

  getRecentDroneData(limit = 50, userId?: string): DroneData[] {
    return this.getData("drone", limit, userId).map((item) => item.data)
  }

  storeAnalysisResult(photoId: string, analysisData: any, userId?: string): string {
    return this.storeData("analysis", analysisData, userId, {
      photoId,
      analysisType: analysisData.type || "crop_health",
    })
  }

  getAnalysisHistory(limit = 30, userId?: string): any[] {
    return this.getData("analysis", limit, userId).map((item) => item.data)
  }

  exportData(): string {
    const stored = this.initStorage()
    return JSON.stringify(stored, null, 2)
  }

  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData)
      if (Array.isArray(data)) {
        this.saveStorage(data)
        return true
      }
      return false
    } catch (error) {
      console.error("[v0] Error importing data:", error)
      return false
    }
  }
}

export class DataStorage {
  static storePhotos(photos: any[]): void {
    photos.forEach((photo) => {
      dataStorage.storePhotoData(photo)
    })
  }

  static getPhotos(limit = 20): any[] {
    return dataStorage.getRecentPhotos(limit)
  }

  static storeEnvironmentalData(data: EnvironmentalData): void {
    dataStorage.storeEnvironmentalData(data)
  }

  static getEnvironmentalData(limit = 10): EnvironmentalData[] {
    return dataStorage.getRecentEnvironmentalData(limit)
  }

  static storeDroneData(data: DroneData): void {
    dataStorage.storeDroneData(data)
  }

  static getDroneData(limit = 50): DroneData[] {
    return dataStorage.getRecentDroneData(limit)
  }

  static clearAll(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem("agrisecure_data")
    }
  }
}

export const dataStorage = new DataStorageService()

export const storageUtils = {
  // Cache environmental data with automatic refresh
  cacheEnvironmentalData: async (fetchFn: () => Promise<EnvironmentalData>, userId?: string) => {
    try {
      const data = await fetchFn()
      dataStorage.storeEnvironmentalData(data, userId)
      return data
    } catch (error) {
      console.error("[v0] Error caching environmental data:", error)
      // Return cached data if available
      const cached = dataStorage.getRecentEnvironmentalData(1, userId)
      return cached.length > 0 ? cached[0] : null
    }
  },

  // Cache photo with analysis status
  cachePhotoUpload: (photoData: PhotoData, userId?: string) => {
    return dataStorage.storePhotoData(photoData, userId)
  },

  // Update photo analysis results
  updatePhotoAnalysis: (photoId: string, analysisResults: any, userId?: string) => {
    const photos = dataStorage.getRecentPhotos(100, userId)
    const photo = photos.find((p) => p.id === photoId)

    if (photo) {
      photo.analysisResults = analysisResults
      photo.analysisStatus = "completed"
      dataStorage.updateData(photoId, photo)

      // Also store as separate analysis result
      dataStorage.storeAnalysisResult(photoId, analysisResults, userId)
    }
  },

  // Get dashboard summary data
  getDashboardSummary: (userId?: string) => {
    const recentPhotos = dataStorage.getRecentPhotos(5, userId)
    const recentEnvironmental = dataStorage.getRecentEnvironmentalData(1, userId)
    const recentDrone = dataStorage.getRecentDroneData(3, userId)
    const recentAnalysis = dataStorage.getAnalysisHistory(10, userId)

    return {
      photos: recentPhotos,
      environmental: recentEnvironmental[0] || null,
      drones: recentDrone,
      analysis: recentAnalysis,
      stats: dataStorage.getStorageStats(),
    }
  },
}

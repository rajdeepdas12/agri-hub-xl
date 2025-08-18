// Photo Management API Service
// Handles user uploads and drone imagery using API key authentication

export interface PhotoUploadResponse {
  id: string
  url: string
  filename: string
  size: number
  uploadedAt: string
  metadata: {
    width: number
    height: number
    format: string
    source: "user" | "drone"
  }
}

export interface DronePhoto {
  id: string
  droneId: string
  url: string
  thumbnailUrl: string
  capturedAt: string
  location: {
    lat: number
    lng: number
    altitude: number
  }
  metadata: {
    width: number
    height: number
    format: string
    fileSize: number
    cameraSettings: {
      iso: number
      shutterSpeed: string
      aperture: string
    }
  }
  analysis?: {
    cropHealth: number
    diseaseDetected: boolean
    ndviValue: number
    recommendations: string[]
  }
}

export interface PhotoGallery {
  userPhotos: PhotoUploadResponse[]
  dronePhotos: DronePhoto[]
  totalCount: number
  lastUpdated: string
}

// Photo API configuration
export interface PhotoApiConfig {
  baseUrl: string
  apiKey: string
  maxFileSize: number // in bytes
  allowedFormats: string[]
  compressionQuality: number
}

// Default photo API configuration
export const defaultPhotoConfig: PhotoApiConfig = {
  baseUrl: "https://api.agrisecure.com/photos",
  apiKey: "AIzaSyDPHkQqGg-SKXd0PitnSwD4qzWhGnLiWc",
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFormats: ["jpg", "jpeg", "png", "webp", "tiff"],
  compressionQuality: 0.8,
}

// Get photo API configuration
export function getPhotoApiConfig(): PhotoApiConfig {
  return {
    baseUrl: process.env.NEXT_PUBLIC_PHOTO_API_URL || defaultPhotoConfig.baseUrl,
    apiKey: process.env.NEXT_PUBLIC_API_KEY || defaultPhotoConfig.apiKey,
    maxFileSize: Number(process.env.NEXT_PUBLIC_MAX_FILE_SIZE) || defaultPhotoConfig.maxFileSize,
    allowedFormats: process.env.NEXT_PUBLIC_ALLOWED_FORMATS?.split(",") || defaultPhotoConfig.allowedFormats,
    compressionQuality: Number(process.env.NEXT_PUBLIC_COMPRESSION_QUALITY) || defaultPhotoConfig.compressionQuality,
  }
}

// Build headers for photo API requests
export function buildPhotoApiHeaders(apiKey?: string): HeadersInit {
  const config = getPhotoApiConfig()
  const key = apiKey || config.apiKey

  return {
    Authorization: `Bearer ${key}`,
    "X-API-Version": "v1",
    "User-Agent": "AgriSecure-PhotoAPI/1.0",
  }
}

// Upload user photo
export async function uploadUserPhoto(file: File, metadata?: Record<string, any>): Promise<PhotoUploadResponse> {
  const config = getPhotoApiConfig()

  // Validate file
  if (file.size > config.maxFileSize) {
    throw new Error(`File size exceeds maximum limit of ${config.maxFileSize / (1024 * 1024)}MB`)
  }

  const fileExtension = file.name.split(".").pop()?.toLowerCase()
  if (!fileExtension || !config.allowedFormats.includes(fileExtension)) {
    throw new Error(`File format not supported. Allowed formats: ${config.allowedFormats.join(", ")}`)
  }

  const formData = new FormData()
  formData.append("file", file)
  formData.append("source", "user")
  if (metadata) {
    formData.append("metadata", JSON.stringify(metadata))
  }

  try {
    const response = await fetch(`${config.baseUrl}/upload`, {
      method: "POST",
      headers: buildPhotoApiHeaders(),
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Photo upload error: ${error.message}`)
    }
    throw new Error("Unknown photo upload error")
  }
}

// Get drone photos by drone ID
export async function getDronePhotos(droneId: string, limit = 50): Promise<DronePhoto[]> {
  const config = getPhotoApiConfig()

  try {
    const response = await fetch(`${config.baseUrl}/drone/${droneId}?limit=${limit}`, {
      method: "GET",
      headers: buildPhotoApiHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch drone photos: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Drone photos fetch error: ${error.message}`)
    }
    throw new Error("Unknown drone photos fetch error")
  }
}

// Get all photos (user uploads + drone captures)
export async function getAllPhotos(page = 1, limit = 20): Promise<PhotoGallery> {
  const config = getPhotoApiConfig()

  try {
    const response = await fetch(`${config.baseUrl}/gallery?page=${page}&limit=${limit}`, {
      method: "GET",
      headers: buildPhotoApiHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch photo gallery: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Photo gallery fetch error: ${error.message}`)
    }
    throw new Error("Unknown photo gallery fetch error")
  }
}

// Analyze photo for crop health/disease detection
export async function analyzePhoto(photoId: string): Promise<DronePhoto["analysis"]> {
  const config = getPhotoApiConfig()

  try {
    const response = await fetch(`${config.baseUrl}/analyze/${photoId}`, {
      method: "POST",
      headers: buildPhotoApiHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Photo analysis failed: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Photo analysis error: ${error.message}`)
    }
    throw new Error("Unknown photo analysis error")
  }
}

// Delete photo
export async function deletePhoto(photoId: string): Promise<boolean> {
  const config = getPhotoApiConfig()

  try {
    const response = await fetch(`${config.baseUrl}/${photoId}`, {
      method: "DELETE",
      headers: buildPhotoApiHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Photo deletion failed: ${response.status} ${response.statusText}`)
    }

    return true
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Photo deletion error: ${error.message}`)
    }
    throw new Error("Unknown photo deletion error")
  }
}

// Get photo download URL
export async function getPhotoDownloadUrl(photoId: string): Promise<string> {
  const config = getPhotoApiConfig()

  try {
    const response = await fetch(`${config.baseUrl}/${photoId}/download`, {
      method: "GET",
      headers: buildPhotoApiHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to get download URL: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.downloadUrl
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Download URL error: ${error.message}`)
    }
    throw new Error("Unknown download URL error")
  }
}

// Batch upload multiple photos
export async function batchUploadPhotos(files: File[], metadata?: Record<string, any>): Promise<PhotoUploadResponse[]> {
  const uploadPromises = files.map((file) => uploadUserPhoto(file, metadata))

  try {
    return await Promise.all(uploadPromises)
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Batch upload error: ${error.message}`)
    }
    throw new Error("Unknown batch upload error")
  }
}

// Search photos by criteria
export async function searchPhotos(criteria: {
  source?: "user" | "drone"
  dateFrom?: string
  dateTo?: string
  droneId?: string
  hasAnalysis?: boolean
  diseaseDetected?: boolean
}): Promise<PhotoGallery> {
  const config = getPhotoApiConfig()
  const params = new URLSearchParams()

  Object.entries(criteria).forEach(([key, value]) => {
    if (value !== undefined) {
      params.append(key, String(value))
    }
  })

  try {
    const response = await fetch(`${config.baseUrl}/search?${params.toString()}`, {
      method: "GET",
      headers: buildPhotoApiHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Photo search failed: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Photo search error: ${error.message}`)
    }
    throw new Error("Unknown photo search error")
  }
}

// Demo data for testing
export const demoPhotoData = {
  userPhoto: {
    id: "photo_user_001",
    url: "https://api.agrisecure.com/photos/user_001.jpg",
    filename: "crop_sample.jpg",
    size: 2048576,
    uploadedAt: new Date().toISOString(),
    metadata: {
      width: 1920,
      height: 1080,
      format: "jpeg",
      source: "user" as const,
    },
  },
  dronePhoto: {
    id: "photo_drone_001",
    droneId: "AGRI-01",
    url: "https://api.agrisecure.com/photos/drone_001.jpg",
    thumbnailUrl: "https://api.agrisecure.com/photos/drone_001_thumb.jpg",
    capturedAt: new Date().toISOString(),
    location: {
      lat: 40.7128,
      lng: -74.006,
      altitude: 50,
    },
    metadata: {
      width: 4000,
      height: 3000,
      format: "jpeg",
      fileSize: 5242880,
      cameraSettings: {
        iso: 100,
        shutterSpeed: "1/500",
        aperture: "f/5.6",
      },
    },
    analysis: {
      cropHealth: 87,
      diseaseDetected: false,
      ndviValue: 0.78,
      recommendations: [
        "Crop health is good overall",
        "Continue current irrigation schedule",
        "Monitor for early signs of nutrient deficiency",
      ],
    },
  },
}

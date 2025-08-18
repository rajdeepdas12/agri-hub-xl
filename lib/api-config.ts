// API Configuration and Key Management
export interface ApiConfig {
  baseUrl: string
  apiKey: string
  version: string
  timeout: number
}

// Demo API configuration with sample key
export const defaultApiConfig: ApiConfig = {
  baseUrl: "https://api.agrisecure.com",
  apiKey: "AIzaSyDPHkQqGg-SKXd0PitnSwD4qzWhGnLiWc",
  version: "v1",
  timeout: 30000, // 30 seconds
}

// Environment-based API configuration
export function getApiConfig(): ApiConfig {
  return {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || defaultApiConfig.baseUrl,
    apiKey: process.env.NEXT_PUBLIC_API_KEY || defaultApiConfig.apiKey,
    version: process.env.NEXT_PUBLIC_API_VERSION || defaultApiConfig.version,
    timeout: Number.parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || "30000"),
  }
}

// API key validation
export function validateApiKey(apiKey: string): boolean {
  // Basic validation for demo purposes
  const apiKeyPattern = /^demo_ak_[a-f0-9]{16}_agrisecure_v\d+$/
  return apiKeyPattern.test(apiKey)
}

// API request headers builder
export function buildApiHeaders(apiKey?: string): HeadersInit {
  const config = getApiConfig()
  const key = apiKey || config.apiKey

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`,
    "X-API-Version": config.version,
    "User-Agent": "AgriSecure-Hub/1.0",
  }
}

// API request function using traditional function syntax
export async function apiRequest<T>(endpoint: string, options: RequestInit = {}, customApiKey?: string): Promise<T> {
  const config = getApiConfig()
  const url = `${config.baseUrl}/${endpoint}`

  const defaultOptions: RequestInit = {
    headers: buildApiHeaders(customApiKey),
    ...options,
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.timeout)

    const response = await fetch(url, {
      ...defaultOptions,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`API Error: ${error.message}`)
    }
    throw new Error("Unknown API error occurred")
  }
}

// Specific API endpoints for AgriSecure Hub
export const apiEndpoints = {
  // Drone management
  drones: {
    list: "drones",
    status: (droneId: string) => `drones/${droneId}/status`,
    deploy: "drones/deploy",
    recall: (droneId: string) => `drones/${droneId}/recall`,
  },

  // Crop monitoring
  crops: {
    health: "crops/health",
    diseases: "crops/diseases",
    analysis: (fieldId: string) => `crops/analysis/${fieldId}`,
  },

  // Field management
  fields: {
    list: "fields",
    create: "fields",
    update: (fieldId: string) => `fields/${fieldId}`,
    delete: (fieldId: string) => `fields/${fieldId}`,
  },

  // Reports and analytics
  reports: {
    generate: "reports/generate",
    list: "reports",
    download: (reportId: string) => `reports/${reportId}/download`,
  },
}

// Demo data for testing without real API
export const demoApiResponses = {
  droneStatus: {
    id: "drone_001",
    status: "active",
    battery: 85,
    location: { lat: 40.7128, lng: -74.006 },
    mission: "crop_monitoring",
    lastUpdate: new Date().toISOString(),
  },

  cropHealth: {
    fieldId: "field_001",
    overallHealth: 92,
    diseaseDetected: false,
    recommendations: [
      "Continue current irrigation schedule",
      "Monitor for early blight in sector 3",
      "Optimal harvest window: 14-21 days",
    ],
    lastScan: new Date().toISOString(),
  },
}

import { getGeminiConfig, type GeminiApiConfig } from "./gemini-api"

// Enhanced API configuration with Gemini integration
export interface EnhancedApiConfig extends ApiConfig {
  gemini: GeminiApiConfig
}

// Get enhanced API configuration including Gemini
export function getEnhancedApiConfig(): EnhancedApiConfig {
  const baseConfig = getApiConfig()
  const geminiConfig = getGeminiConfig()

  return {
    ...baseConfig,
    gemini: geminiConfig,
  }
}

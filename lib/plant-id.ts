import sharp from "sharp"

// Reuse shared types from the existing analysis report to minimize churn
import type { AnalysisReport, CropDiseaseAnalysis } from "@/lib/gemini-api"

interface PlantIdConfig {
  apiKey: string
  baseUrl: string
  timeoutMs: number
}

const defaultPlantIdConfig: PlantIdConfig = {
  apiKey:
    process.env.PLANT_ID_API_KEY ||
    process.env.NEXT_PUBLIC_PLANT_ID_API_KEY ||
    "4WqopttRYAnqww061goOgqIbNMwXwWjfMZ18QEVelt2T056kKi",
  baseUrl: process.env.PLANT_ID_API_URL || "https://plant.id/api/v3",
  timeoutMs: 30000,
}

export function getPlantIdConfig(): PlantIdConfig {
  return {
    apiKey: defaultPlantIdConfig.apiKey,
    baseUrl: defaultPlantIdConfig.baseUrl,
    timeoutMs: defaultPlantIdConfig.timeoutMs,
  }
}

function isValidPlantIdKey(): boolean {
  const cfg = getPlantIdConfig()
  return !!cfg.apiKey && cfg.apiKey.length > 20
}

async function fileToBase64(imagePath: string): Promise<string> {
  const fs = await import("fs")
  const buf = fs.readFileSync(imagePath)
  return buf.toString("base64")
}

function buildPlantIdRequest(base64Image: string) {
  // Generic v3 identification payload with disease focus. This aligns with Plant.id public docs patterns.
  return {
    images: [base64Image],
    // Request richer disease details when available
    disease_details: [
      "common_names",
      "description",
      "classification",
      "treatment",
      "url",
    ],
    // Ask for similar images to improve confidence (optional)
    modifiers: ["similar_images"],
    plant_language: "en",
  }
}

function normalizeDiseaseName(value: string | undefined | null): string {
  if (!value) return "healthy"
  const lower = value.toLowerCase()
  if (lower.includes("healthy") || lower.includes("no disease")) return "healthy"
  return value
}

function toAnalysisReport(
  imagePath: string,
  imageMeta: { width: number; height: number; format: string; size: number },
  best: {
    cropName: string
    diseaseName: string
    confidence: number
    severity?: "low" | "medium" | "high" | "critical"
    symptoms?: string[]
    causes?: string[]
    treatments?: string[]
    prevention?: string[]
    recommendations?: string[]
    urgency?: "immediate" | "within_week" | "within_month" | "monitor"
    estimatedYieldLoss?: number
    costOfTreatment?: { low: number; high: number; currency: string }
  },
): AnalysisReport {
  const analysis: CropDiseaseAnalysis = {
    cropName: best.cropName || "Unknown crop",
    diseaseName: normalizeDiseaseName(best.diseaseName),
    confidence: Math.min(Math.max(Math.round(best.confidence), 0), 100),
    severity: best.severity || "low",
    symptoms: best.symptoms || [],
    causes: best.causes || [],
    treatments: best.treatments || [],
    prevention: best.prevention || [],
    recommendations: best.recommendations || [],
    urgency: best.urgency || "monitor",
    estimatedYieldLoss: best.estimatedYieldLoss ?? 0,
    costOfTreatment: best.costOfTreatment || { low: 0, high: 0, currency: "USD" },
  }

  return {
    id: `plantid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    imageInfo: {
      filename: imagePath.split("/").pop() || "unknown",
      size: imageMeta.size,
      dimensions: { width: imageMeta.width, height: imageMeta.height },
      format: imageMeta.format,
    },
    analysis,
    environmentalFactors: {
      temperature: "N/A",
      humidity: "N/A",
      soilCondition: "N/A",
      season: "N/A",
    },
    reportGenerated: new Date().toISOString(),
    version: "plant.id-v3",
  }
}

export async function analyzeWithPlantId(imagePath: string): Promise<AnalysisReport> {
  const config = getPlantIdConfig()

  if (!isValidPlantIdKey()) {
    throw new Error("Plant.id API key not configured")
  }

  const base64 = await fileToBase64(imagePath)
  const payloads = [
    buildPlantIdRequest(base64),
    buildPlantIdRequest(`data:image/jpeg;base64,${base64}`),
  ]

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs)

  try {
    let response: Response | null = null
    const endpoints = [
      `${config.baseUrl}/identification`,
      `${config.baseUrl}/identify`,
    ]

    for (const endpoint of endpoints) {
      for (const payload of payloads) {
        try {
          const r = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Api-Key": config.apiKey,
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
          })
          if (r.ok) {
            response = r
            break
          }
        } catch (e) {
          // try next
        }
      }
      if (response) break
    }

    clearTimeout(timeout)

    if (!response) throw new Error("Plant.id API request failed for all fallbacks")
    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Plant.id API error: ${response.status} ${response.statusText} - ${text}`)
    }

    const data: any = await response.json()

    // Attempt to extract disease details from multiple possible shapes
    let cropName = "Unknown crop"
    let diseaseName = "healthy"
    let confidence = 75
    const symptoms: string[] = []
    const treatments: string[] = []
    const causes: string[] = []
    const prevention: string[] = []

    // v3 may return results under "result" or top-level suggestions
    const suggestions = data?.result?.classification?.suggestions || data?.result?.disease?.suggestions || data?.suggestions || []
    if (Array.isArray(suggestions) && suggestions.length > 0) {
      const top = suggestions[0]
      cropName = top?.plant_name || top?.name || cropName
      diseaseName = top?.disease?.name || top?.name || diseaseName
      confidence = Math.round((top?.probability ?? top?.confidence ?? 0.75) * (top?.probability ? 100 : 1))

      const details = top?.disease || top
      if (details?.common_names && Array.isArray(details.common_names)) {
        // Enrich symptoms/causes as best-effort from common names/description
      }
      if (details?.description) {
        symptoms.push(details.description)
      }
      if (details?.treatment) {
        if (typeof details.treatment === "string") treatments.push(details.treatment)
        if (Array.isArray(details.treatment)) treatments.push(...details.treatment)
      }
    }

    const meta = await (async () => {
      const m = await sharp(imagePath).metadata()
      const fs = await import("fs")
      const stats = fs.statSync(imagePath)
      return {
        width: m.width || 0,
        height: m.height || 0,
        format: (m.format || "unknown").toUpperCase(),
        size: stats.size,
      }
    })()

    return toAnalysisReport(imagePath, meta, {
      cropName,
      diseaseName,
      confidence,
      symptoms,
      causes,
      treatments,
      prevention,
    })
  } catch (err) {
    clearTimeout(timeout)
    throw err
  }
}

export default {
  analyzeWithPlantId,
  getPlantIdConfig,
}


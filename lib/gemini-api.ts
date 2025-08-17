// Gemini 2.0 Flash API Integration
// Based on AI/ML API documentation for google/gemini-2.0-flash

export interface GeminiMessage {
  role: "user" | "assistant" | "system"
  content: string
  name?: string
}

export interface GeminiRequest {
  model: "google/gemini-2.0-flash"
  messages: GeminiMessage[]
  max_completion_tokens?: number
  max_tokens?: number
  stream?: boolean
  temperature?: number
  top_p?: number
  stop?: string | string[]
  frequency_penalty?: number
  presence_penalty?: number
  seed?: number
}

export interface GeminiResponse {
  id: string
  object: "chat.completion"
  choices: Array<{
    index: number
    finish_reason: "stop" | "length" | "content_filter"
    message: {
      role: "assistant"
      content: string
    }
  }>
  created: number
  model: string
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// Gemini API configuration
export interface GeminiApiConfig {
  baseUrl: string
  apiKey: string
  model: string
  timeout: number
}

// Default Gemini API configuration
export const defaultGeminiConfig: GeminiApiConfig = {
  baseUrl: "https://api.aimlapi.com/v1",
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "AIzaSyB9v75XZMdfvTs23g4M8Y3aSiI5Z5lRohA",
  model: "google/gemini-2.0-flash",
  timeout: 30000,
}

// Get Gemini API configuration
export function getGeminiConfig(): GeminiApiConfig {
  return {
    baseUrl: process.env.NEXT_PUBLIC_GEMINI_BASE_URL || defaultGeminiConfig.baseUrl,
    apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || defaultGeminiConfig.apiKey,
    model: process.env.NEXT_PUBLIC_GEMINI_MODEL || defaultGeminiConfig.model,
    timeout: Number(process.env.NEXT_PUBLIC_GEMINI_TIMEOUT) || defaultGeminiConfig.timeout,
  }
}

// Build headers for Gemini API requests
export function buildGeminiHeaders(apiKey?: string): HeadersInit {
  const config = getGeminiConfig()
  const key = apiKey || config.apiKey

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`,
    Accept: "*/*",
  }
}

// Make Gemini API request
export async function callGeminiApi(request: GeminiRequest): Promise<GeminiResponse> {
  const config = getGeminiConfig()
  const url = `${config.baseUrl}/chat/completions`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), config.timeout)

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: buildGeminiHeaders(),
      body: JSON.stringify({
        model: config.model,
        ...request,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    return await response.json()
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Gemini API request timeout")
    }
    throw error
  }
}

// Analyze image using Gemini Vision
export async function analyzeImageWithGemini(
  imageBase64: string,
  prompt = "Analyze this agricultural image for crop health, diseases, and provide recommendations.",
): Promise<string> {
  try {
    const request: GeminiRequest = {
      model: "google/gemini-2.0-flash",
      messages: [
        {
          role: "user",
          content: `${prompt}\n\nImage data: ${imageBase64}`,
        },
      ],
      max_tokens: 1000,
      temperature: 0.3,
    }

    const response = await callGeminiApi(request)
    return response.choices[0]?.message?.content || "No analysis available"
  } catch (error) {
    console.error("[v0] Gemini image analysis error:", error)
    throw error
  }
}

// Generate crop health report using Gemini
export async function generateCropHealthReport(data: {
  cropType: string
  symptoms: string[]
  environmentalConditions: Record<string, any>
  imageAnalysis?: string
}): Promise<string> {
  try {
    const prompt = `
As an agricultural AI expert, analyze the following crop health data and provide a comprehensive report:

Crop Type: ${data.cropType}
Observed Symptoms: ${data.symptoms.join(", ")}
Environmental Conditions: ${JSON.stringify(data.environmentalConditions, null, 2)}
${data.imageAnalysis ? `Image Analysis: ${data.imageAnalysis}` : ""}

Please provide:
1. Health assessment (1-100 scale)
2. Disease identification (if any)
3. Treatment recommendations
4. Prevention strategies
5. Expected recovery timeline

Format the response as a structured report.
`

    const request: GeminiRequest = {
      model: "google/gemini-2.0-flash",
      messages: [
        {
          role: "system",
          content:
            "You are an expert agricultural AI assistant specializing in crop health analysis and disease diagnosis.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 1500,
      temperature: 0.2,
    }

    const response = await callGeminiApi(request)
    return response.choices[0]?.message?.content || "Report generation failed"
  } catch (error) {
    console.error("[v0] Gemini report generation error:", error)
    throw error
  }
}

// Generate treatment recommendations using Gemini
export async function generateTreatmentRecommendations(
  diseaseType: string,
  severity: string,
  cropType: string,
  fieldConditions: Record<string, any>,
): Promise<string> {
  try {
    const prompt = `
Provide detailed treatment recommendations for:

Disease: ${diseaseType}
Severity: ${severity}
Crop: ${cropType}
Field Conditions: ${JSON.stringify(fieldConditions, null, 2)}

Include:
1. Immediate actions required
2. Chemical treatments (with specific products and dosages)
3. Organic alternatives
4. Application timing and methods
5. Follow-up monitoring schedule
6. Cost estimates
7. Expected success rate

Provide practical, actionable advice for farmers.
`

    const request: GeminiRequest = {
      model: "google/gemini-2.0-flash",
      messages: [
        {
          role: "system",
          content: "You are a plant pathology expert providing treatment recommendations for crop diseases.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 1200,
      temperature: 0.1,
    }

    const response = await callGeminiApi(request)
    return response.choices[0]?.message?.content || "Treatment recommendations unavailable"
  } catch (error) {
    console.error("[v0] Gemini treatment recommendations error:", error)
    throw error
  }
}

// Analyze drone data using Gemini
export async function analyzeDroneData(droneData: {
  flightPath: Array<{ lat: number; lng: number; altitude: number }>
  sensorReadings: Record<string, number[]>
  imageCount: number
  missionType: string
}): Promise<string> {
  try {
    const prompt = `
Analyze this drone agricultural survey data:

Mission Type: ${droneData.missionType}
Flight Path Points: ${droneData.flightPath.length}
Images Captured: ${droneData.imageCount}
Sensor Data: ${JSON.stringify(droneData.sensorReadings, null, 2)}

Provide insights on:
1. Coverage efficiency
2. Data quality assessment
3. Anomalies detected
4. Recommendations for future flights
5. Priority areas for follow-up
`

    const request: GeminiRequest = {
      model: "google/gemini-2.0-flash",
      messages: [
        {
          role: "system",
          content: "You are a precision agriculture specialist analyzing drone survey data.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 800,
      temperature: 0.3,
    }

    const response = await callGeminiApi(request)
    return response.choices[0]?.message?.content || "Drone data analysis unavailable"
  } catch (error) {
    console.error("[v0] Gemini drone analysis error:", error)
    throw error
  }
}

// Demo response for testing when API key is not available
export function getDemoGeminiResponse(type: "image" | "report" | "treatment" | "drone"): string {
  const demoResponses = {
    image:
      "Demo Analysis: Crop appears healthy with 85% vegetation coverage. Minor nutrient deficiency detected in lower leaves. Recommend nitrogen supplementation.",
    report:
      "Demo Report: Overall crop health: 87/100. No major diseases detected. Irrigation levels optimal. Harvest window: 14-21 days.",
    treatment:
      "Demo Treatment: Apply balanced fertilizer (10-10-10) at 200kg/hectare. Monitor weekly for pest activity. Expected improvement in 7-10 days.",
    drone:
      "Demo Drone Analysis: Flight coverage 95% complete. 247 images captured. Anomaly detected in sector 3 - investigate irrigation system.",
  }

  return demoResponses[type] || "Demo response not available"
}

export default {
  callGeminiApi,
  analyzeImageWithGemini,
  generateCropHealthReport,
  generateTreatmentRecommendations,
  analyzeDroneData,
  getDemoGeminiResponse,
}

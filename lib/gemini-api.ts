// Gemini 2.0 Flash API Service for Crop Disease Analysis
// Based on the official Gemini 2.0 Flash API documentation

export interface CropDiseaseAnalysis {
  cropName: string
  diseaseName: string
  confidence: number
  severity: "low" | "medium" | "high" | "critical"
  symptoms: string[]
  causes: string[]
  treatments: string[]
  prevention: string[]
  recommendations: string[]
  urgency: "immediate" | "within_week" | "within_month" | "monitor"
  estimatedYieldLoss: number // percentage
  costOfTreatment: {
    low: number
    high: number
    currency: string
  }
}

export interface AnalysisReport {
  id: string
  timestamp: string
  imageInfo: {
    filename: string
    size: number
    dimensions: { width: number; height: number }
    format: string
  }
  analysis: CropDiseaseAnalysis
  environmentalFactors: {
    temperature: string
    humidity: string
    soilCondition: string
    season: string
  }
  reportGenerated: string
  version: string
}

export interface GeminiConfig {
  apiKey: string
  model: string
  maxTokens: number
  temperature: number
  topP: number
  topK: number
}

// Default Gemini 2.0 Flash configuration
export const defaultGeminiConfig: GeminiConfig = {
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "",
  model: "gemini-2.0-flash-exp",
  maxTokens: 8192,
  temperature: 0.4,
  topP: 0.8,
  topK: 40,
}

// Get Gemini API configuration
export function getGeminiConfig(): GeminiConfig {
  return {
    apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || defaultGeminiConfig.apiKey,
    model: process.env.NEXT_PUBLIC_GEMINI_MODEL || defaultGeminiConfig.model,
    maxTokens: Number(process.env.NEXT_PUBLIC_GEMINI_MAX_TOKENS) || defaultGeminiConfig.maxTokens,
    temperature: Number(process.env.NEXT_PUBLIC_GEMINI_TEMPERATURE) || defaultGeminiConfig.temperature,
    topP: Number(process.env.NEXT_PUBLIC_GEMINI_TOP_P) || defaultGeminiConfig.topP,
    topK: Number(process.env.NEXT_PUBLIC_GEMINI_TOP_K) || defaultGeminiConfig.topK,
  }
}

// Convert image to base64 for API
async function imageToBase64(imagePath: string): Promise<string> {
  const fs = await import("fs")
  const imageBuffer = fs.readFileSync(imagePath)
  return imageBuffer.toString("base64")
}

// Build Gemini API request payload according to official documentation
function buildGeminiRequest(
  base64Image: string,
  prompt: string,
  config: GeminiConfig
) {
  return {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: prompt,
          },
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: base64Image,
            },
          },
        ],
      },
    ],
    generation_config: {
      temperature: config.temperature,
      top_p: config.topP,
      top_k: config.topK,
      max_output_tokens: config.maxTokens,
      candidate_count: 1,
    },
    safety_settings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
    ],
  }
}

// Analyze crop image for disease detection using Gemini 2.0 Flash
export async function analyzeCropDisease(imagePath: string): Promise<AnalysisReport> {
  const config = getGeminiConfig()
  
  if (!config.apiKey) {
    throw new Error("Gemini API key not configured")
  }

  try {
    // Convert image to base64
    const base64Image = await imageToBase64(imagePath)
    
    // Create comprehensive prompt for crop disease analysis
    const prompt = `You are an expert agricultural scientist and plant pathologist with 20+ years of experience in crop disease diagnosis and treatment. Analyze this crop image and provide a detailed disease analysis report.

Please identify:
1. The crop type/name (be specific about variety if possible)
2. Any diseases or health issues present
3. The severity level (low/medium/high/critical)
4. Specific symptoms visible in the image
5. Likely causes and contributing factors
6. Treatment recommendations with specific products and dosages
7. Prevention measures for future outbreaks
8. Urgency of action needed
9. Estimated yield loss percentage
10. Cost range for treatment

Respond in the following JSON format ONLY (no additional text):
{
  "cropName": "string (specific crop name)",
  "diseaseName": "string or 'healthy' if no disease",
  "confidence": number (0-100),
  "severity": "low|medium|high|critical",
  "symptoms": ["array of specific symptoms"],
  "causes": ["array of causes and contributing factors"],
  "treatments": ["array of specific treatments with dosages"],
  "prevention": ["array of prevention measures"],
  "recommendations": ["array of actionable recommendations"],
  "urgency": "immediate|within_week|within_month|monitor",
  "estimatedYieldLoss": number (0-100),
  "costOfTreatment": {
    "low": number,
    "high": number,
    "currency": "USD"
  }
}

If the crop appears healthy, indicate "healthy" as diseaseName and provide general care recommendations. Be precise and actionable in your analysis.`

    const requestBody = buildGeminiRequest(base64Image, prompt, config)

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error("Invalid response from Gemini API")
    }

    const responseText = data.candidates[0].content.parts[0].text
    
    // Parse JSON response
    let analysisData: CropDiseaseAnalysis
    try {
      // Extract JSON from response (handle cases where response might have extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("No JSON found in response")
      }
      analysisData = JSON.parse(jsonMatch[0])
      
      // Validate required fields
      if (!analysisData.cropName || !analysisData.diseaseName) {
        throw new Error("Invalid analysis data: missing required fields")
      }
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", responseText)
      throw new Error("Failed to parse analysis response")
    }

    // Get image metadata
    const sharp = await import("sharp")
    const metadata = await sharp.default(imagePath).metadata()
    const fs = await import("fs")
    const stats = fs.statSync(imagePath)

    // Create comprehensive report
    const report: AnalysisReport = {
      id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      imageInfo: {
        filename: imagePath.split("/").pop() || "unknown",
        size: stats.size,
        dimensions: {
          width: metadata.width || 0,
          height: metadata.height || 0,
        },
        format: metadata.format || "unknown",
      },
      analysis: analysisData,
      environmentalFactors: {
        temperature: "20-30°C (estimated)",
        humidity: "60-80% (estimated)",
        soilCondition: "Well-drained (estimated)",
        season: getCurrentSeason(),
      },
      reportGenerated: new Date().toISOString(),
      version: "2.0.0",
    }

    return report
  } catch (error) {
    console.error("Crop disease analysis failed:", error)
    throw error
  }
}

// Generate detailed PDF report
export async function generateAnalysisReport(report: AnalysisReport): Promise<string> {
  const reportText = `
CROP DISEASE ANALYSIS REPORT
============================

Report ID: ${report.id}
Generated: ${new Date(report.reportGenerated).toLocaleString()}

IMAGE INFORMATION
-----------------
Filename: ${report.imageInfo.filename}
Size: ${(report.imageInfo.size / 1024 / 1024).toFixed(2)} MB
Dimensions: ${report.imageInfo.dimensions.width} x ${report.imageInfo.dimensions.height}
Format: ${report.imageInfo.format}

ANALYSIS RESULTS
----------------
Crop Name: ${report.analysis.cropName}
Disease: ${report.analysis.diseaseName}
Confidence: ${report.analysis.confidence}%
Severity: ${report.analysis.severity.toUpperCase()}
Urgency: ${report.analysis.urgency.replace("_", " ").toUpperCase()}

SYMPTOMS
--------
${report.analysis.symptoms.map(s => `• ${s}`).join("\n")}

CAUSES
------
${report.analysis.causes.map(c => `• ${c}`).join("\n")}

TREATMENTS
----------
${report.analysis.treatments.map(t => `• ${t}`).join("\n")}

PREVENTION
----------
${report.analysis.prevention.map(p => `• ${p}`).join("\n")}

RECOMMENDATIONS
---------------
${report.analysis.recommendations.map(r => `• ${r}`).join("\n")}

FINANCIAL IMPACT
----------------
Estimated Yield Loss: ${report.analysis.estimatedYieldLoss}%
Treatment Cost Range: $${report.analysis.costOfTreatment.low} - $${report.analysis.costOfTreatment.high} ${report.analysis.costOfTreatment.currency}

ENVIRONMENTAL FACTORS
---------------------
Temperature: ${report.environmentalFactors.temperature}
Humidity: ${report.environmentalFactors.humidity}
Soil Condition: ${report.environmentalFactors.soilCondition}
Season: ${report.environmentalFactors.season}

---
Report generated by AgriSecure Hub using Gemini 2.0 Flash AI
Version: ${report.version}
  `

  return reportText
}

// Get current season based on date
function getCurrentSeason(): string {
  const month = new Date().getMonth()
  if (month >= 2 && month <= 4) return "Spring"
  if (month >= 5 && month <= 7) return "Summer"
  if (month >= 8 && month <= 10) return "Fall"
  return "Winter"
}

// Batch analyze multiple images
export async function batchAnalyzeCrops(imagePaths: string[]): Promise<AnalysisReport[]> {
  const reports: AnalysisReport[] = []
  
  for (const imagePath of imagePaths) {
    try {
      const report = await analyzeCropDisease(imagePath)
      reports.push(report)
      console.log(`Analysis completed for: ${imagePath}`)
    } catch (error) {
      console.error(`Analysis failed for ${imagePath}:`, error)
      // Continue with other images
    }
  }
  
  return reports
}

// Get analysis history (would integrate with database)
export async function getAnalysisHistory(limit = 10): Promise<AnalysisReport[]> {
  // This would fetch from database
  // For now, return empty array
  return []
}

export default {
  analyzeCropDisease,
  generateAnalysisReport,
  batchAnalyzeCrops,
  getAnalysisHistory,
}

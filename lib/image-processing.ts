import sharp from "sharp"
import path from "path"

// Image processing utilities for agricultural analysis
export interface ImageAnalysisResult {
  dimensions: { width: number; height: number }
  colorAnalysis: {
    dominant: string
    greenness: number
    brownness: number
    healthScore: number
  }
  metadata: {
    format: string
    size: number
    density?: number
    hasAlpha: boolean
  }
  cropHealth?: {
    healthyPixels: number
    stressedPixels: number
    diseasePixels: number
    overallHealth: "healthy" | "stressed" | "diseased"
  }
}

// Analyze image for crop health indicators
export async function analyzeImage(imagePath: string): Promise<ImageAnalysisResult> {
  try {
    const image = sharp(imagePath)
    const metadata = await image.metadata()
    const stats = await image.stats()

    // Basic image info
    const dimensions = {
      width: metadata.width || 0,
      height: metadata.height || 0,
    }

    // Color analysis for crop health
    const colorAnalysis = analyzeColors(stats)

    // Crop health assessment based on color analysis
    const cropHealth = assessCropHealth(colorAnalysis)

    return {
      dimensions,
      colorAnalysis,
      metadata: {
        format: metadata.format || "unknown",
        size: metadata.size || 0,
        density: metadata.density,
        hasAlpha: metadata.hasAlpha || false,
      },
      cropHealth,
    }
  } catch (error) {
    console.error("[v0] Error analyzing image:", error)
    throw error
  }
}

// Analyze color distribution for health indicators
function analyzeColors(stats: sharp.Stats): ImageAnalysisResult["colorAnalysis"] {
  // Calculate greenness (healthy vegetation indicator)
  const greenChannel = stats.channels[1] // Green channel
  const redChannel = stats.channels[0] // Red channel
  const blueChannel = stats.channels[2] // Blue channel

  const greenness = (greenChannel.mean / 255) * 100
  const brownness = ((redChannel.mean + blueChannel.mean) / 2 / 255) * 100

  // Health score based on green vs brown ratio
  const healthScore = Math.max(0, Math.min(100, greenness - brownness + 50))

  // Determine dominant color
  const maxChannel = Math.max(redChannel.mean, greenChannel.mean, blueChannel.mean)
  let dominant = "unknown"
  if (maxChannel === greenChannel.mean) dominant = "green"
  else if (maxChannel === redChannel.mean) dominant = "red"
  else dominant = "blue"

  return {
    dominant,
    greenness: Math.round(greenness),
    brownness: Math.round(brownness),
    healthScore: Math.round(healthScore),
  }
}

// Assess crop health based on color analysis
function assessCropHealth(colorAnalysis: ImageAnalysisResult["colorAnalysis"]): ImageAnalysisResult["cropHealth"] {
  const { greenness, brownness, healthScore } = colorAnalysis

  // Simulate pixel analysis (in real implementation, this would use computer vision)
  const totalPixels = 1000000 // Simulated total pixels
  const healthyPixels = Math.round((healthScore / 100) * totalPixels)
  const stressedPixels = Math.round(((100 - healthScore) / 2 / 100) * totalPixels)
  const diseasePixels = totalPixels - healthyPixels - stressedPixels

  let overallHealth: "healthy" | "stressed" | "diseased"
  if (healthScore > 70) overallHealth = "healthy"
  else if (healthScore > 40) overallHealth = "stressed"
  else overallHealth = "diseased"

  return {
    healthyPixels,
    stressedPixels,
    diseasePixels,
    overallHealth,
  }
}

// Generate processed versions of images
export async function processImageVariants(
  inputPath: string,
  outputDir: string,
  filename: string,
): Promise<{
  thumbnail: string
  medium: string
  large: string
  analysis: string
}> {
  const baseName = path.parse(filename).name
  const image = sharp(inputPath)

  const variants = {
    thumbnail: path.join(outputDir, `${baseName}_thumb.jpg`),
    medium: path.join(outputDir, `${baseName}_medium.jpg`),
    large: path.join(outputDir, `${baseName}_large.jpg`),
    analysis: path.join(outputDir, `${baseName}_analysis.jpg`),
  }

  try {
    // Generate thumbnail (300x300)
    await image
      .clone()
      .resize(300, 300, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(variants.thumbnail)

    // Generate medium size (800x800)
    await image
      .clone()
      .resize(800, 800, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toFile(variants.medium)

    // Generate large size (1920x1920)
    await image
      .clone()
      .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toFile(variants.large)

    // Generate analysis version with enhanced contrast
    await image
      .clone()
      .resize(800, 800, { fit: "inside", withoutEnlargement: true })
      .modulate({ brightness: 1.1, saturation: 1.2 })
      .sharpen()
      .jpeg({ quality: 85 })
      .toFile(variants.analysis)

    console.log("[v0] Generated image variants for:", filename)
    return variants
  } catch (error) {
    console.error("[v0] Error processing image variants:", error)
    throw error
  }
}

// Extract EXIF data for GPS and camera info
export async function extractImageMetadata(imagePath: string): Promise<{
  gps?: { latitude: number; longitude: number; altitude?: number }
  camera?: { make?: string; model?: string; datetime?: string }
  technical?: { iso?: number; aperture?: string; shutter?: string }
}> {
  try {
    const metadata = await sharp(imagePath).metadata()
    const exif = metadata.exif

    if (!exif) {
      return {}
    }

    // Parse EXIF data (simplified - in real implementation, use exif-parser library)
    const result: any = {}

    // GPS data extraction would go here
    // Camera info extraction would go here
    // Technical settings extraction would go here

    return result
  } catch (error) {
    console.error("[v0] Error extracting metadata:", error)
    return {}
  }
}

// Batch process multiple images
export async function batchProcessImages(
  imagePaths: string[],
  outputDir: string,
  options: {
    generateVariants?: boolean
    analyzeHealth?: boolean
    extractMetadata?: boolean
  } = {},
): Promise<
  Array<{
    inputPath: string
    success: boolean
    analysis?: ImageAnalysisResult
    variants?: any
    metadata?: any
    error?: string
  }>
> {
  const results = []

  for (const imagePath of imagePaths) {
    try {
      const filename = path.basename(imagePath)
      const result: any = {
        inputPath: imagePath,
        success: true,
      }

      if (options.analyzeHealth) {
        result.analysis = await analyzeImage(imagePath)
      }

      if (options.generateVariants) {
        result.variants = await processImageVariants(imagePath, outputDir, filename)
      }

      if (options.extractMetadata) {
        result.metadata = await extractImageMetadata(imagePath)
      }

      results.push(result)
      console.log("[v0] Processed image:", filename)
    } catch (error) {
      results.push({
        inputPath: imagePath,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
      console.error("[v0] Error processing image:", imagePath, error)
    }
  }

  return results
}

export default {
  analyzeImage,
  processImageVariants,
  extractImageMetadata,
  batchProcessImages,
}

import { type NextRequest, NextResponse } from "next/server"
import { LocalDatabaseService, checkLocalDatabaseConnection } from "@/lib/local-database"
import FileStorage from "@/lib/file-storage"
import ImageProcessing from "@/lib/image-processing"

// Configure for large file uploads
export const maxDuration = 300 // 5 minutes
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
	console.log("[v0] Photo upload request received")

	try {
		// Initialize storage directories
		try {
			const { initializeStorage } = await import("@/lib/file-storage")
			await initializeStorage()
			console.log("[v0] Storage initialized successfully")
		} catch (initError) {
			console.error("[v0] Storage initialization failed:", initError)
			// Continue anyway, the upload might still work
		}

		// Analysis is performed later via /api/photos/analyze

		console.log("[v0] Checking local database connection...")
		const dbConnected = await checkLocalDatabaseConnection()
		console.log("[v0] Local database connection status:", dbConnected)

		console.log("[v0] Parsing form data...")
		const formData = await request.formData()
		const file = formData.get("file") as File
		const userId = (formData.get("userId") as string) || "1"
		const fieldId = formData.get("fieldId") as string
		const source = (formData.get("source") as string) || "upload"
		const tags = formData.get("tags") as string

		console.log("[v0] Upload parameters:", {
			fileName: file?.name,
			fileSize: file?.size,
			fileType: file?.type,
			userId,
			fieldId,
			source,
		})

		if (!file) {
			console.log("[v0] No file provided in request")
			return NextResponse.json({ error: "No file provided" }, { status: 400 })
		}

		console.log("[v0] Validating file...")
		try {
			const validation = FileStorage.validateFile(file)
			if (!validation.valid) {
				console.log("[v0] File validation failed:", validation.error)
				return NextResponse.json({ error: validation.error }, { status: validation.statusCode || 400 })
			}
			console.log("[v0] File validation passed")
		} catch (validationError: any) {
			console.error("[v0] File validation error:", validationError)
			return NextResponse.json(
				{
					error: "File validation failed",
					details: validationError.message,
				},
				{ status: validationError.statusCode || 400 },
			)
		}

		console.log("[v0] Saving file to storage...")
		let savedFile
		try {
			savedFile = await FileStorage.saveUploadedFile(file, "photos", Number.parseInt(userId))
			console.log("[v0] File saved to storage:", savedFile)
		} catch (storageError: any) {
			console.error("[v0] File storage error:", storageError)

			let statusCode = 500
			let errorMessage = "Failed to save file"

			if (storageError.message.includes("exceeds") || storageError.message.includes("limit")) {
				statusCode = 413 // Payload Too Large
				errorMessage = "File too large"
			} else if (storageError.message.includes("not supported")) {
				statusCode = 415 // Unsupported Media Type
				errorMessage = "File type not supported"
			} else if (storageError.message.includes("preview environment")) {
				statusCode = 503 // Service Unavailable
				errorMessage = "File storage temporarily unavailable in preview mode"
			}

			return NextResponse.json(
				{
					error: errorMessage,
					details: storageError.message,
					timestamp: new Date().toISOString(),
				},
				{ status: statusCode },
			)
		}

		console.log("[v0] Extracting GPS metadata...")
		let gpsData = null
		if (file.type.startsWith("image/")) {
			try {
				console.log("[v0] About to call ImageProcessing.extractImageMetadata...")
				const metadata = await ImageProcessing.extractImageMetadata(savedFile.filepath)
				gpsData = metadata.gps
				console.log("[v0] GPS metadata extracted:", gpsData)
			} catch (error) {
				console.log("[v0] GPS extraction failed (non-critical):", error)
				console.log("[v0] GPS extraction error stack:", error instanceof Error ? error.stack : "No stack")
			}
		}

		let photo = null

		try {
			console.log("[v0] Preparing photo data for local database...")
			// Save photo record to local database
			const photoData = {
				user_id: Number.parseInt(userId),
				field_id: fieldId ? Number.parseInt(fieldId) : null,
				filename: savedFile.filename,
				original_name: file.name,
				file_path: savedFile.filepath,
				file_size: savedFile.size,
				mime_type: savedFile.mimetype,
				source: source as "upload" | "drone" | "satellite",
				capture_date: new Date(),
				gps_latitude: gpsData?.latitude || null,
				gps_longitude: gpsData?.longitude || null,
				altitude: gpsData?.altitude || null,
				analysis_status: "pending",
				analysis_results: null,
				tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
			}

			console.log("[v0] About to call LocalDatabaseService.savePhoto...")
			photo = await LocalDatabaseService.savePhoto(photoData)
			console.log("[v0] Photo saved to local database with ID:", photo.id)
		} catch (dbError) {
			console.error("[v0] Local database operation failed:", dbError)
			console.error("[v0] Database error stack:", dbError instanceof Error ? dbError.stack : "No stack")
			return NextResponse.json(
				{
					error: "Failed to save to local database",
					details: dbError instanceof Error ? dbError.message : "Database error",
				},
				{ status: 500 },
			)
		}

		// Prepare base64 for client to directly call /api/photos/analyze
		let imageBase64: string | null = null
		try {
			if (file.type.startsWith("image/")) {
				const fs = await import("fs")
				const buffer = fs.readFileSync(savedFile.filepath)
				imageBase64 = buffer.toString("base64")
			}
		} catch {}

		console.log("[v0] Upload completed successfully")
		return NextResponse.json({
			success: true,
			photo: {
				id: photo?.id,
				filename: savedFile.filename,
				originalName: file.name,
				filePath: savedFile.filepath,
				fileSize: savedFile.size,
				mimeType: savedFile.mimetype,
				source: source,
				captureDate: new Date(),
				analysisStatus: photo?.analysis_status || "pending",
				analysisResults: photo?.analysis_results,
				isPreviewMode: savedFile.isBase64 || false,
			},
			imageBase64,
			message: "Upload completed. Use /api/photos/analyze to analyze the image.",
		})
	} catch (error: any) {
		console.error("[v0] Photo upload error:", error)

		let statusCode = 500
		let errorMessage = "Failed to upload photo"

		if (error.message.includes("File size") || error.message.includes("exceeds")) {
			statusCode = 413
			errorMessage = "File too large - maximum 20MB allowed"
		} else if (error.message.includes("not supported") || error.message.includes("MIME")) {
			statusCode = 415
			errorMessage = "File type not supported - use JPG, PNG, or WEBP"
		} else if (error.message.includes("No file")) {
			statusCode = 400
			errorMessage = "No file provided"
		}

		return NextResponse.json(
			{
				error: errorMessage,
				details: error.message,
				timestamp: new Date().toISOString(),
				statusCode,
			},
			{ status: statusCode },
		)
	}
}
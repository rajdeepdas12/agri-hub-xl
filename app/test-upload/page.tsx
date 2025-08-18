"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"

export default function TestUploadPage() {
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<string>("")

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setResult("")

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("userId", "1")
      formData.append("source", "upload")

      console.log("Uploading file:", file.name, file.size, file.type)

      const response = await fetch("/api/photos/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setResult(`✅ Upload successful! File: ${data.photo.filename}`)
        console.log("Upload result:", data)
      } else {
        setResult(`❌ Upload failed: ${data.error}`)
        console.error("Upload error:", data)
      }
    } catch (error) {
      setResult(`❌ Upload error: ${error instanceof Error ? error.message : "Unknown error"}`)
      console.error("Upload error:", error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">File Upload Test</h1>
      
      <div className="space-y-6">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 mb-4">
            Select an image file to test the upload functionality
          </p>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {uploading && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Uploading...</p>
          </div>
        )}

        {result && (
          <div className={`p-4 rounded-lg ${
            result.startsWith("✅") ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
          }`}>
            <p className="font-medium">{result}</p>
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-2">Upload Requirements:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• File size: Maximum 20MB</li>
            <li>• Supported formats: JPG, PNG, WEBP, TIFF</li>
            <li>• Images will be analyzed for crop health</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
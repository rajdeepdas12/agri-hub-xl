"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export default function TestUploadSimplePage() {
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>("")

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError("")
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("userId", "1")

      console.log("Uploading file:", file.name, "Size:", file.size, "Type:", file.type)

      const response = await fetch("/api/photos/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        console.log("Upload successful:", data)
        setResult(data)
      } else {
        console.error("Upload failed:", data)
        setError(`Upload failed: ${data.error}`)
      }
    } catch (error) {
      console.error("Upload error:", error)
      setError(`Upload error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Simple Photo Upload Test</h1>
        <p className="text-gray-600">
          Test the photo upload API with Gemini 2.0 Flash integration
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Photo
            </CardTitle>
            <CardDescription>
              Upload a crop image for analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
            </div>

            {uploading && (
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-green-600" />
                <p className="text-gray-600">Uploading and analyzing...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-800 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <p className="font-medium">{error}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Results
            </CardTitle>
            <CardDescription>
              Upload and analysis results
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-medium text-green-900 mb-2">Upload Successful!</h3>
                  <p className="text-sm text-green-700">Photo ID: {result.photo?.id}</p>
                  <p className="text-sm text-green-700">Filename: {result.photo?.filename}</p>
                  <p className="text-sm text-green-700">Status: {result.photo?.analysisStatus}</p>
                </div>

                {result.photo?.cropAnalysis && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-blue-900 mb-2">Crop Analysis Results</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Crop:</strong> {result.photo.cropAnalysis.cropName}</p>
                      <p><strong>Disease:</strong> {result.photo.cropAnalysis.diseaseName}</p>
                      <p><strong>Confidence:</strong> {result.photo.cropAnalysis.confidence}%</p>
                      <p><strong>Severity:</strong> {result.photo.cropAnalysis.severity}</p>
                      <p><strong>Urgency:</strong> {result.photo.cropAnalysis.urgency}</p>
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Raw Response</h3>
                  <pre className="text-xs overflow-auto max-h-40">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <p>Upload a photo to see results</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* API Status */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>API Status</CardTitle>
          <CardDescription>
            Current API configuration and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="font-medium">Gemini API Key</p>
              <p className="text-gray-600">
                {process.env.NEXT_PUBLIC_GEMINI_API_KEY ? "Configured" : "Not configured"}
              </p>
            </div>
            <div>
              <p className="font-medium">Upload Directory</p>
              <p className="text-gray-600">./uploads</p>
            </div>
            <div>
              <p className="font-medium">Max File Size</p>
              <p className="text-gray-600">20MB</p>
            </div>
            <div>
              <p className="font-medium">Analysis Timeout</p>
              <p className="text-gray-600">5 minutes</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
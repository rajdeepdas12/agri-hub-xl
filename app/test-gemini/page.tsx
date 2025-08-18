"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, Download, FileText, Eye, AlertCircle, CheckCircle } from "lucide-react"

interface CropAnalysis {
  cropName: string
  diseaseName: string
  confidence: number
  severity: "low" | "medium" | "high" | "critical"
  urgency: "immediate" | "within_week" | "within_month" | "monitor"
  estimatedYieldLoss: number
  treatments: string[]
  recommendations: string[]
  report: string
}

export default function TestGeminiPage() {
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<CropAnalysis | null>(null)
  const [error, setError] = useState<string>("")
  const [reportPreview, setReportPreview] = useState<string>("")

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError("")
    setAnalysis(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("userId", "1")
      formData.append("source", "upload")

      console.log("Uploading file for Gemini analysis:", file.name, file.size, file.type)

      const response = await fetch("/api/photos/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        console.log("Upload and analysis result:", data)
        
        if (data.photo.cropAnalysis) {
          setAnalysis(data.photo.cropAnalysis)
          setReportPreview(data.photo.cropAnalysis.report.substring(0, 300) + "...")
        } else {
          setError("Analysis completed but no crop analysis data received")
        }
      } else {
        setError(`Upload failed: ${data.error}`)
        console.error("Upload error:", data)
      }
    } catch (error) {
      setError(`Upload error: ${error instanceof Error ? error.message : "Unknown error"}`)
      console.error("Upload error:", error)
    } finally {
      setUploading(false)
    }
  }

  const handleDirectAnalysis = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setAnalyzing(true)
    setError("")
    setAnalysis(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("userId", "1")

      console.log("Direct analysis of file:", file.name)

      const response = await fetch("/api/photos/analyze", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        console.log("Direct analysis result:", data)
        setAnalysis(data.analysis)
        setReportPreview(data.report.substring(0, 300) + "...")
      } else {
        setError(`Analysis failed: ${data.error}`)
        console.error("Analysis error:", data)
      }
    } catch (error) {
      setError(`Analysis error: ${error instanceof Error ? error.message : "Unknown error"}`)
      console.error("Analysis error:", error)
    } finally {
      setAnalyzing(false)
    }
  }

  const downloadReport = async (format: "text" | "json") => {
    if (!analysis) return

    try {
      const response = await fetch("/api/photos/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          photoId: "1", // This would be the actual photo ID
          format,
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `crop_analysis_report.${format === "json" ? "json" : "txt"}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        setError("Failed to download report")
      }
    } catch (error) {
      setError("Failed to download report")
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low": return "bg-green-100 text-green-800"
      case "medium": return "bg-yellow-100 text-yellow-800"
      case "high": return "bg-orange-100 text-orange-800"
      case "critical": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case "immediate": return <AlertCircle className="w-4 h-4 text-red-500" />
      case "within_week": return <AlertCircle className="w-4 h-4 text-orange-500" />
      case "within_month": return <AlertCircle className="w-4 h-4 text-yellow-500" />
      case "monitor": return <CheckCircle className="w-4 h-4 text-green-500" />
      default: return <Eye className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Gemini 2.0 Flash Crop Analysis Test</h1>
        <p className="text-gray-600">
          Test the new Gemini 2.0 Flash API for comprehensive crop disease analysis and report generation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload and Analysis Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload & Analyze
              </CardTitle>
              <CardDescription>
                Upload a crop image for comprehensive disease analysis using Gemini 2.0 Flash
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-4">
                  Upload an image for full analysis (upload + analysis)
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-4">
                  Direct analysis only (skip upload)
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleDirectAnalysis}
                  disabled={analyzing}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
              </div>

              {(uploading || analyzing) && (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">
                    {uploading ? "Uploading and analyzing..." : "Analyzing..."}
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 text-red-800 p-4 rounded-lg">
                  <p className="font-medium">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Analysis Results Section */}
        <div className="space-y-6">
          {analysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Analysis Results
                </CardTitle>
                <CardDescription>
                  Comprehensive crop disease analysis powered by Gemini 2.0 Flash
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Crop Name</p>
                    <p className="font-semibold">{analysis.cropName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Disease</p>
                    <p className="font-semibold">{analysis.diseaseName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Confidence</p>
                    <p className="font-semibold">{analysis.confidence}%</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Yield Loss</p>
                    <p className="font-semibold">{analysis.estimatedYieldLoss}%</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Badge className={getSeverityColor(analysis.severity)}>
                    Severity: {analysis.severity.toUpperCase()}
                  </Badge>
                  <Badge className="flex items-center gap-1">
                    {getUrgencyIcon(analysis.urgency)}
                    {analysis.urgency.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Treatments</p>
                  <ul className="space-y-1">
                    {analysis.treatments.slice(0, 3).map((treatment, index) => (
                      <li key={index} className="text-sm">• {treatment}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Recommendations</p>
                  <ul className="space-y-1">
                    {analysis.recommendations.slice(0, 3).map((rec, index) => (
                      <li key={index} className="text-sm">• {rec}</li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => downloadReport("text")}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Report
                  </Button>
                  <Button
                    onClick={() => downloadReport("json")}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Download JSON
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {reportPreview && (
            <Card>
              <CardHeader>
                <CardTitle>Report Preview</CardTitle>
                <CardDescription>
                  Detailed analysis report generated by Gemini 2.0 Flash
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm whitespace-pre-wrap">{reportPreview}</pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* API Information */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Gemini 2.0 Flash API Configuration</CardTitle>
          <CardDescription>
            Current API settings and capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="font-medium">Model</p>
              <p className="text-gray-600">gemini-2.0-flash-exp</p>
            </div>
            <div>
              <p className="font-medium">Max Tokens</p>
              <p className="text-gray-600">8,192</p>
            </div>
            <div>
              <p className="font-medium">Temperature</p>
              <p className="text-gray-600">0.4</p>
            </div>
            <div>
              <p className="font-medium">Analysis Features</p>
              <p className="text-gray-600">Crop ID, Disease Detection, Treatment Plans</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
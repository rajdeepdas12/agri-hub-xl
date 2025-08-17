"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Upload, 
  Download, 
  FileText, 
  Eye, 
  AlertCircle, 
  CheckCircle, 
  Leaf, 
  Activity,
  Droplets,
  Sun,
  Thermometer,
  Calendar,
  DollarSign,
  TrendingUp,
  Shield,
  Zap
} from "lucide-react"

interface CropAnalysisReport {
  id: string
  timestamp: string
  cropName: string
  diseaseName: string
  confidence: number
  severity: "low" | "medium" | "high" | "critical"
  urgency: "immediate" | "within_week" | "within_month" | "monitor"
  estimatedYieldLoss: number
  symptoms: string[]
  causes: string[]
  treatments: string[]
  prevention: string[]
  recommendations: string[]
  costOfTreatment: {
    low: number
    high: number
    currency: string
  }
  fertilizers?: string[]
  pesticides?: string[]
  organicTreatments?: string[]
}

export default function CropAnalysisReportPage() {
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [report, setReport] = useState<CropAnalysisReport | null>(null)
  const [error, setError] = useState<string>("")
  const [showDetailedReport, setShowDetailedReport] = useState(false)
  const [photoId, setPhotoId] = useState<string>("")
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([])

  // Load analysis history on component mount
  useEffect(() => {
    loadAnalysisHistory()
  }, [])

  const loadAnalysisHistory = async () => {
    try {
      const response = await fetch("/api/photos/analyze-enhanced?userId=1")
      if (response.ok) {
        const data = await response.json()
        setAnalysisHistory(data.enhancedAnalysisHistory || [])
      }
    } catch (error) {
      console.error("Failed to load analysis history:", error)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setAnalyzing(true)
    setError("")
    setReport(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("userId", "1")
      formData.append("includeReport", "true")

      console.log("Uploading and analyzing file:", file.name)

      const response = await fetch("/api/photos/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        console.log("Upload and analysis result:", data)
        if (data.photo?.cropAnalysis) {
          setReport(data.photo.cropAnalysis)
        }
        // Reload analysis history
        await loadAnalysisHistory()
      } else {
        setError(`Upload failed: ${data.error}`)
        console.error("Upload error:", data)
      }
    } catch (error) {
      setError(`Upload error: ${error instanceof Error ? error.message : "Unknown error"}`)
      console.error("Upload error:", error)
    } finally {
      setUploading(false)
      setAnalyzing(false)
    }
  }

  const handlePhotoIdAnalysis = async () => {
    if (!photoId.trim()) {
      setError("Please enter a photo ID")
      return
    }

    setAnalyzing(true)
    setError("")
    setReport(null)

    try {
      const formData = new FormData()
      formData.append("photoId", photoId.trim())
      formData.append("userId", "1")
      formData.append("includeReport", "true")

      const response = await fetch("/api/photos/analyze-enhanced", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        console.log("Analysis result:", data)
        setReport(data.analysis)
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
    if (!report) return

    try {
      const response = await fetch("/api/photos/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          photoId: photoId || "1",
          format,
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `crop_analysis_report_${report.cropName}_${report.diseaseName}.${format === "json" ? "json" : "txt"}`
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

  const extractFertilizers = (treatments: string[]) => {
    return treatments.filter(treatment => 
      treatment.toLowerCase().includes('fertilizer') || 
      treatment.toLowerCase().includes('npk') ||
      treatment.toLowerCase().includes('nitrogen') ||
      treatment.toLowerCase().includes('phosphorus') ||
      treatment.toLowerCase().includes('potassium')
    )
  }

  const extractPesticides = (treatments: string[]) => {
    return treatments.filter(treatment => 
      treatment.toLowerCase().includes('pesticide') || 
      treatment.toLowerCase().includes('fungicide') ||
      treatment.toLowerCase().includes('insecticide') ||
      treatment.toLowerCase().includes('chemical')
    )
  }

  const extractOrganicTreatments = (treatments: string[]) => {
    return treatments.filter(treatment => 
      treatment.toLowerCase().includes('organic') || 
      treatment.toLowerCase().includes('natural') ||
      treatment.toLowerCase().includes('neem') ||
      treatment.toLowerCase().includes('garlic') ||
      treatment.toLowerCase().includes('compost')
    )
  }

  return (
    <div className="container mx-auto p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Crop Analysis Report</h1>
        <p className="text-gray-600">
          Comprehensive crop disease analysis with fertilizer and treatment recommendations powered by Gemini 2.0 Flash AI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Upload and Analysis Section */}
        <div className="lg:col-span-1 space-y-6">
          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload New Image
              </CardTitle>
              <CardDescription>
                Upload a crop image for analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Leaf className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-4">
                  Upload an image for analysis
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading || analyzing}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
              </div>

              {uploading && (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Uploading...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Photo ID Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Analyze Existing Photo
              </CardTitle>
              <CardDescription>
                Analyze a previously uploaded photo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="photoId">Photo ID</Label>
                <Input
                  id="photoId"
                  value={photoId}
                  onChange={(e) => setPhotoId(e.target.value)}
                  placeholder="Enter photo ID"
                  disabled={analyzing}
                />
              </div>
              <Button
                onClick={handlePhotoIdAnalysis}
                disabled={!photoId.trim() || analyzing}
                className="w-full"
              >
                {analyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Analyzing...
                  </>
                ) : (
                  "Analyze Photo"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Analysis History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Recent Analysis
              </CardTitle>
              <CardDescription>
                Your recent crop analyses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {analysisHistory.length > 0 ? (
                  analysisHistory.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                      onClick={() => setPhotoId(item.id.toString())}
                    >
                      <p className="font-medium text-sm">{item.cropName}</p>
                      <p className="text-xs text-gray-600">{item.diseaseName}</p>
                      <Badge className={`text-xs mt-1 ${getSeverityColor(item.severity)}`}>
                        {item.severity}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No recent analyses</p>
                )}
              </div>
            </CardContent>
          </Card>

          {error && (
            <div className="bg-red-50 text-red-800 p-4 rounded-lg">
              <p className="font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* Analysis Results Section */}
        <div className="lg:col-span-3 space-y-6">
          {report ? (
            <>
              {/* Main Analysis Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Crop Analysis Results
                  </CardTitle>
                  <CardDescription>
                    Comprehensive analysis powered by Gemini 2.0 Flash AI
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-500">Crop Name</p>
                      <p className="font-semibold text-blue-900">{report.cropName}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-500">Disease</p>
                      <p className="font-semibold text-red-900">{report.diseaseName}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-500">Confidence</p>
                      <p className="font-semibold text-green-900">{report.confidence}%</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-500">Yield Loss</p>
                      <p className="font-semibold text-yellow-900">{report.estimatedYieldLoss}%</p>
                    </div>
                  </div>

                  {/* Severity and Urgency */}
                  <div className="flex gap-2">
                    <Badge className={`${getSeverityColor(report.severity)} text-sm px-3 py-1`}>
                      Severity: {report.severity.toUpperCase()}
                    </Badge>
                    <Badge className="flex items-center gap-1 text-sm px-3 py-1">
                      {getUrgencyIcon(report.urgency)}
                      {report.urgency.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Fertilizers and Treatments */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Fertilizers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Droplets className="w-5 h-5 text-blue-500" />
                      Recommended Fertilizers
                    </CardTitle>
                    <CardDescription>
                      Nutrient supplements for crop health
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {extractFertilizers(report.treatments).length > 0 ? (
                      <ul className="space-y-2">
                        {extractFertilizers(report.treatments).map((fertilizer, index) => (
                          <li key={index} className="text-sm bg-blue-50 p-3 rounded border-l-4 border-blue-500">
                            • {fertilizer}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 text-sm">No specific fertilizers recommended</p>
                    )}
                  </CardContent>
                </Card>

                {/* Pesticides */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-red-500" />
                      Pesticides & Chemicals
                    </CardTitle>
                    <CardDescription>
                      Chemical treatments for disease control
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {extractPesticides(report.treatments).length > 0 ? (
                      <ul className="space-y-2">
                        {extractPesticides(report.treatments).map((pesticide, index) => (
                          <li key={index} className="text-sm bg-red-50 p-3 rounded border-l-4 border-red-500">
                            • {pesticide}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 text-sm">No chemical pesticides recommended</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Organic Treatments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Leaf className="w-5 h-5 text-green-500" />
                    Organic & Natural Treatments
                  </CardTitle>
                  <CardDescription>
                    Environmentally friendly treatment options
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {extractOrganicTreatments(report.treatments).length > 0 ? (
                    <ul className="space-y-2">
                      {extractOrganicTreatments(report.treatments).map((treatment, index) => (
                        <li key={index} className="text-sm bg-green-50 p-3 rounded border-l-4 border-green-500">
                          • {treatment}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-sm">No organic treatments specifically mentioned</p>
                  )}
                </CardContent>
              </Card>

              {/* Symptoms and Causes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Symptoms
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {report.symptoms.map((symptom, index) => (
                        <li key={index} className="text-sm bg-gray-50 p-2 rounded">• {symptom}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Causes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {report.causes.map((cause, index) => (
                        <li key={index} className="text-sm bg-gray-50 p-2 rounded">• {cause}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Financial Impact */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-yellow-500" />
                    Financial Impact
                  </CardTitle>
                  <CardDescription>
                    Cost analysis and recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Estimated Yield Loss</p>
                      <p className="font-semibold text-red-600 text-lg">{report.estimatedYieldLoss}%</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Treatment Cost Range</p>
                      <p className="font-semibold text-green-600 text-lg">
                        ${report.costOfTreatment.low} - ${report.costOfTreatment.high} {report.costOfTreatment.currency}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-500" />
                    Actionable Recommendations
                  </CardTitle>
                  <CardDescription>
                    Specific steps to improve crop health
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {report.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm bg-purple-50 p-3 rounded border-l-4 border-purple-500">
                        • {rec}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowDetailedReport(!showDetailedReport)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  {showDetailedReport ? "Hide" : "Show"} Detailed Report
                </Button>
                <Button
                  onClick={() => downloadReport("text")}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Report
                </Button>
                <Button
                  onClick={() => downloadReport("json")}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Download JSON
                </Button>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Leaf className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Results</h3>
                <p className="text-gray-600">
                  Upload an image or enter a photo ID to get started with crop analysis.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Upload, Download, FileText, Eye, AlertCircle, CheckCircle, Leaf, Activity } from "lucide-react"

interface EnhancedCropAnalysis {
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
}

export default function TestEnhancedGeminiPage() {
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<EnhancedCropAnalysis | null>(null)
  const [error, setError] = useState<string>("")
  const [report, setReport] = useState<string>("")
  const [showReport, setShowReport] = useState(false)

  const handleEnhancedAnalysis = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setAnalyzing(true)
    setError("")
    setAnalysis(null)
    setReport("")

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("userId", "1")
      formData.append("includeReport", "true")
      formData.append("reportFormat", "text")

      console.log("Enhanced analysis of file:", file.name)

      const response = await fetch("/api/photos/analyze-enhanced", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        console.log("Enhanced analysis result:", data)
        setAnalysis(data.analysis)
        if (data.report) {
          setReport(data.report)
        }
      } else {
        setError(`Enhanced analysis failed: ${data.error}`)
        console.error("Enhanced analysis error:", data)
      }
    } catch (error) {
      setError(`Enhanced analysis error: ${error instanceof Error ? error.message : "Unknown error"}`)
      console.error("Enhanced analysis error:", error)
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
        a.download = `enhanced_crop_analysis_report.${format === "json" ? "json" : "txt"}`
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
    <div className="container mx-auto p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Enhanced Gemini 2.0 Flash Crop Analysis</h1>
        <p className="text-gray-600">
          Advanced crop disease analysis powered by Gemini 2.0 Flash API with comprehensive reporting and treatment recommendations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload and Analysis Section */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Enhanced Analysis
              </CardTitle>
              <CardDescription>
                Upload a crop image for comprehensive disease analysis using Gemini 2.0 Flash
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Leaf className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-4">
                  Upload an image for enhanced analysis
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleEnhancedAnalysis}
                  disabled={analyzing}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
              </div>

              {analyzing && (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Enhanced analysis in progress...</p>
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
        <div className="lg:col-span-2 space-y-6">
          {analysis && (
            <>
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
                <CardContent className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

                  {/* Severity and Urgency */}
                  <div className="flex gap-2">
                    <Badge className={getSeverityColor(analysis.severity)}>
                      Severity: {analysis.severity.toUpperCase()}
                    </Badge>
                    <Badge className="flex items-center gap-1">
                      {getUrgencyIcon(analysis.urgency)}
                      {analysis.urgency.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>

                  {/* Symptoms */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Symptoms
                    </h4>
                    <ul className="space-y-1">
                      {analysis.symptoms.map((symptom, index) => (
                        <li key={index} className="text-sm bg-gray-50 p-2 rounded">• {symptom}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Causes */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Causes</h4>
                    <ul className="space-y-1">
                      {analysis.causes.map((cause, index) => (
                        <li key={index} className="text-sm bg-gray-50 p-2 rounded">• {cause}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Treatments */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Treatments</h4>
                    <ul className="space-y-1">
                      {analysis.treatments.map((treatment, index) => (
                        <li key={index} className="text-sm bg-green-50 p-2 rounded border-l-4 border-green-500">• {treatment}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Prevention */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Prevention</h4>
                    <ul className="space-y-1">
                      {analysis.prevention.map((prevention, index) => (
                        <li key={index} className="text-sm bg-blue-50 p-2 rounded border-l-4 border-blue-500">• {prevention}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
                    <ul className="space-y-1">
                      {analysis.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm bg-purple-50 p-2 rounded border-l-4 border-purple-500">• {rec}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Financial Impact */}
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h4 className="font-medium text-gray-900 mb-2">Financial Impact</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Estimated Yield Loss</p>
                        <p className="font-semibold text-red-600">{analysis.estimatedYieldLoss}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Treatment Cost Range</p>
                        <p className="font-semibold">
                          ${analysis.costOfTreatment.low} - ${analysis.costOfTreatment.high} {analysis.costOfTreatment.currency}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowReport(!showReport)}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      {showReport ? "Hide" : "Show"} Report
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
                </CardContent>
              </Card>

              {/* Detailed Report */}
              {showReport && report && (
                <Card>
                  <CardHeader>
                    <CardTitle>Detailed Analysis Report</CardTitle>
                    <CardDescription>
                      Comprehensive report generated by Gemini 2.0 Flash AI
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={report}
                      readOnly
                      className="min-h-[400px] font-mono text-sm"
                    />
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      {/* API Information */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Enhanced Gemini 2.0 Flash API Features</CardTitle>
          <CardDescription>
            Advanced capabilities and configuration
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
              <p className="font-medium">Analysis Features</p>
              <p className="text-gray-600">Crop ID, Disease Detection, Treatment Plans</p>
            </div>
            <div>
              <p className="font-medium">Report Generation</p>
              <p className="text-gray-600">Comprehensive PDF/Text Reports</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
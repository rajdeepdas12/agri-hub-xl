"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Leaf,
  Camera,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Upload,
  BarChart3,
  Plane,
  Satellite,
  MapPin,
  FileText,
  X,
  Loader2,
  Download,
  Calendar,
  RefreshCw,
  Eye,
} from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { useState, useRef, useCallback, useEffect } from "react"
import { toast } from "@/components/ui/use-toast"
import { DataStorage } from "@/lib/data-storage"

interface UploadedPhoto {
  id: number
  filename: string
  originalName: string
  filePath: string
  fileSize: number
  mimeType: string
  source: string
  analysisStatus: string
  analysisResults?: any
  createdAt: string
}

interface UploadProgress {
  file: File
  progress: number
  status: "uploading" | "analyzing" | "completed" | "error"
  error?: string
  result?: UploadedPhoto
}

export default function AgriDashboard() {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [recentPhotos, setRecentPhotos] = useState<UploadedPhoto[]>([])
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isBatchMode, setIsBatchMode] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const batchFileInputRef = useRef<HTMLInputElement>(null)

  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [isExportingData, setIsExportingData] = useState(false)
  const [reports, setReports] = useState([
    {
      id: 1,
      title: "Weekly Crop Health Summary",
      type: "Health Report",
      date: "2 hours ago",
      size: "2.4 MB",
      format: "PDF",
      status: "Ready",
      downloadUrl: "/api/reports/download/weekly-health-summary.pdf",
    },
    {
      id: 2,
      title: "Disease Detection Analysis - North Field",
      type: "Disease Report",
      date: "5 hours ago",
      size: "1.8 MB",
      format: "PDF",
      status: "Ready",
      downloadUrl: "/api/reports/download/disease-analysis-north.pdf",
    },
    {
      id: 3,
      title: "Environmental Data Export",
      type: "Data Export",
      date: "1 day ago",
      size: "856 KB",
      format: "CSV",
      status: "Ready",
      downloadUrl: "/api/reports/download/environmental-data.csv",
    },
    {
      id: 4,
      title: "Drone Mission Summary - March",
      type: "Mission Report",
      date: "2 days ago",
      size: "3.1 MB",
      format: "PDF",
      status: "Processing",
      downloadUrl: null,
    },
  ])

  const [environmentalData, setEnvironmentalData] = useState({
    temperature: 24,
    humidity: 68,
    windSpeed: 12,
    uvIndex: 6,
    soilMoisture: 45,
    rainfall: 2.3,
  })
  const [environmentalLoading, setEnvironmentalLoading] = useState(false)

  const [treatmentRecommendations, setTreatmentRecommendations] = useState([
    {
      id: 1,
      type: "warning",
      title: "Early Blight Treatment",
      description:
        "Apply copper-based fungicide to affected corn plants. Remove infected leaves and improve air circulation.",
      priority: "medium",
      action: "View Details",
    },
    {
      id: 2,
      type: "critical",
      title: "Rust Disease Alert",
      description: "Immediate treatment required for wheat crops. Apply systemic fungicide and monitor spread closely.",
      priority: "high",
      action: "Emergency Protocol",
    },
  ])

  const [isLoadingRecentPhotos, setIsLoadingRecentPhotos] = useState(false)
  const [toastMessage, setToastMessage] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null)

  const setToast = (newToast: { message: string; type: "success" | "error" | "info" }) => {
    setToastMessage(newToast)
    setTimeout(() => setToastMessage(null), 5000)
  }

  const fetchRecentPhotos = async () => {
    setIsLoadingRecentPhotos(true)
    try {
      console.log("[v0] Fetching recent photos...")
      const response = await fetch("/api/photos/recent?userId=1&limit=10", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Recent photos fetched successfully:", data.photos?.length || 0)
        setRecentPhotos(data.photos || [])
      } else {
        console.error("Failed to fetch recent photos:", response.status)
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error("Error fetching recent photos:", error)
      // Use cached data as fallback
      const cachedPhotos = DataStorage.getPhotos()
      if (cachedPhotos.length > 0) {
        console.log("[v0] Using cached photos as fallback")
        setRecentPhotos(cachedPhotos)
      }
    } finally {
      setIsLoadingRecentPhotos(false)
    }
  }

  useEffect(() => {
    fetchRecentPhotos()
    handleRefreshEnvironmental()
  }, [])

  const handleRefreshEnvironmental = async () => {
    if (environmentalLoading) return // Prevent multiple simultaneous requests

    try {
      setEnvironmentalLoading(true)
      console.log("[v0] Refreshing environmental data...")
      const response = await fetch("/api/environmental/current")
      if (response.ok) {
        const data = await response.json()
        setEnvironmentalData(data.conditions || data)
        toast({
          title: "Environmental Data Updated",
          description: "Latest environmental conditions loaded.",
        })
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error("[v0] Error refreshing environmental data:", error)
      toast({
        title: "Update Failed",
        description: "Could not refresh environmental data.",
        variant: "destructive",
      })
    } finally {
      setEnvironmentalLoading(false)
    }
  }

  const handleTreatmentAction = async (recommendationId: number, actionType: string) => {
    try {
      console.log("[v0] Processing treatment action:", actionType, "for recommendation:", recommendationId)

      if (actionType === "Emergency Protocol") {
        // Handle rust disease emergency protocol
        const response = await fetch("/api/treatments/emergency-protocol", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recommendationId, treatmentType: "rust_disease" }),
        })

        if (response.ok) {
          toast({
            title: "Emergency Protocol Activated",
            description: "Rust disease treatment protocol has been initiated.",
          })
        }
      } else {
        // Handle general treatment details
        const response = await fetch(`/api/treatments/${recommendationId}/details`)
        if (response.ok) {
          const details = await response.json()
          toast({
            title: "Treatment Details",
            description: "Detailed treatment plan has been generated.",
          })
        }
      }
    } catch (error) {
      console.error("[v0] Error processing treatment action:", error)
      toast({
        title: "Action Failed",
        description: "Could not process treatment action.",
        variant: "destructive",
      })
    }
  }

  const handleQuickAction = async (actionType: string) => {
    try {
      console.log("[v0] Processing quick action:", actionType)

      switch (actionType) {
        case "emergency_survey": {
          const surveyResponse = await fetch("/api/drone/emergency-survey", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ priority: "high", userId: 1 }),
          })
          if (surveyResponse.ok) {
            toast({
              title: "Emergency Survey Launched",
              description: "Drone dispatched for immediate crop assessment.",
            })
          }
          break
        }

        case "schedule_mission":
          setShowMissionPlanner(true)
          break

        case "aerial_report": {
          const reportResponse = await fetch("/api/drone/aerial-report", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: 1, reportType: "comprehensive" }),
          })
          if (reportResponse.ok) {
            const report = await reportResponse.json()
            toast({
              title: "Aerial Report Generated",
              description: "Comprehensive aerial survey report is ready.",
            })
          }
          break
        }
      }
    } catch (error) {
      console.error("[v0] Error processing quick action:", error)
      toast({
        title: "Action Failed",
        description: "Could not complete the requested action.",
        variant: "destructive",
      })
    }
  }

  const handleLaunchDrone = async () => {
    setDroneLoading(true)
    try {
      console.log("[v0] Launching drone...")
      const response = await fetch("/api/drone/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: 1,
          missionType: "routine_patrol",
          priority: "normal",
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Drone Launched",
          description: `${result.droneId} is now airborne for patrol mission.`,
        })
      }
    } catch (error) {
      console.error("[v0] Error launching drone:", error)
      toast({
        title: "Launch Failed",
        description: "Could not launch drone. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDroneLoading(false)
    }
  }

  const generateCropHealthReport = async () => {
    setIsGeneratingReport(true)
    try {
      const response = await fetch("/api/reports/generate-health", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: "user-123", // Replace with actual user ID
          fieldIds: ["field-1", "field-2"], // Replace with selected fields
          dateRange: {
            start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            end: new Date().toISOString(),
          },
          includeImages: true,
          includeAnalytics: true,
        }),
      })

      if (response.ok) {
        const result = await response.json()

        // Add new report to the list
        const newReport = {
          id: Date.now(),
          title: `Crop Health Report - ${new Date().toLocaleDateString()}`,
          type: "Health Report",
          date: "Just now",
          size: result.size || "Processing...",
          format: "PDF",
          status: "Processing",
          downloadUrl: null,
        }

        setReports((prev) => [newReport, ...prev])

        // Simulate processing completion
        setTimeout(() => {
          setReports((prev) =>
            prev.map((report) =>
              report.id === newReport.id
                ? { ...report, status: "Ready", size: "2.1 MB", downloadUrl: result.downloadUrl }
                : report,
            ),
          )
        }, 3000)

        toast({
          title: "Report Generation Started",
          description: "Your crop health report is being generated. You'll be notified when it's ready.",
        })
      } else {
        throw new Error("Failed to generate report")
      }
    } catch (error) {
      console.error("Error generating report:", error)
      toast({
        title: "Generation Failed",
        description: "Failed to generate crop health report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const exportAnalyticsData = async () => {
    setIsExportingData(true)
    try {
      const response = await fetch("/api/reports/export-analytics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: "user-123", // Replace with actual user ID
          dataTypes: ["sensor_readings", "drone_flights", "photo_analysis", "weather_data"],
          format: "csv",
          dateRange: {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            end: new Date().toISOString(),
          },
        }),
      })

      if (response.ok) {
        const result = await response.json()

        // Add new export to the list
        const newExport = {
          id: Date.now(),
          title: `Analytics Data Export - ${new Date().toLocaleDateString()}`,
          type: "Data Export",
          date: "Just now",
          size: "Processing...",
          format: "CSV",
          status: "Processing",
          downloadUrl: null,
        }

        setReports((prev) => [newExport, ...prev])

        // Simulate processing completion
        setTimeout(() => {
          setReports((prev) =>
            prev.map((report) =>
              report.id === newExport.id
                ? { ...report, status: "Ready", size: "1.2 MB", downloadUrl: result.downloadUrl }
                : report,
            ),
          )
        }, 2000)

        toast({
          title: "Export Started",
          description: "Your analytics data is being exported. Download will be available shortly.",
        })
      } else {
        throw new Error("Failed to export data")
      }
    } catch (error) {
      console.error("Error exporting data:", error)
      toast({
        title: "Export Failed",
        description: "Failed to export analytics data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExportingData(false)
    }
  }

  const downloadPhotoPdf = async (photoId: number, filename: string) => {
    try {
      const res = await fetch(`/api/photos/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId, format: "pdf" }),
      })
      if (!res.ok) throw new Error(`Failed to download PDF (${res.status})`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${filename}_analysis.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to download PDF")
    }
  }

  const downloadReport = async (report: any) => {
    if (!report.downloadUrl) return

    try {
      const response = await fetch(report.downloadUrl)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${report.title.replace(/[^a-zA-Z0-9]/g, "_")}.${report.format.toLowerCase()}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Download Started",
          description: `${report.title} is being downloaded.`,
        })
      } else {
        throw new Error("Download failed")
      }
    } catch (error) {
      console.error("Error downloading report:", error)
      toast({
        title: "Download Failed",
        description: "Failed to download the report. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return

    const fileArray = Array.from(files)
    const validFiles = fileArray.filter((file) => {
      const isImage = file.type.startsWith("image/")
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB limit
      return isImage && isValidSize
    })

    if (validFiles.length !== fileArray.length) {
      alert("Some files were skipped. Only image files under 10MB are allowed.")
    }

    validFiles.forEach((file) => uploadFile(file))
  }, [])

  const uploadFile = async (file: File) => {
    const uploadId = Date.now() + Math.random()

    // Add to upload progress
    setUploadProgress((prev) => [
      ...prev,
      {
        file,
        progress: 0,
        status: "uploading",
      },
    ])

    try {
      console.log("[v0] Starting file upload:", file.name, file.size, file.type)

      const maxSize = 20 * 1024 * 1024 // 20MB
      if (file.size > maxSize) {
        throw new Error(`File too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum size is 20MB.`)
      }

      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`File type not supported. Please use JPG, PNG, or WEBP format.`)
      }

      const formData = new FormData()
      formData.append("file", file)
      formData.append("userId", "1")
      formData.append("source", "upload")
      formData.append("tags", "crop-analysis,disease-detection")

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) =>
          prev.map((item) =>
            item.file === file && item.status === "uploading"
              ? { ...item, progress: Math.min(item.progress + 10, 90) }
              : item,
          ),
        )
      }, 200)

      console.log("[v0] Sending upload request to /api/photos/upload")

      const response = await fetch("/api/photos/upload", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)

      console.log("[v0] Upload response status:", response.status, response.statusText)

      if (!response.ok) {
        let errorMessage = "Upload failed"

        try {
          const errorData = await response.json()
          console.log("[v0] Error response body:", errorData)

          switch (response.status) {
            case 400:
              errorMessage = errorData.error || "Invalid file or request"
              break
            case 413:
              errorMessage = "File too large - maximum 20MB allowed"
              break
            case 415:
              errorMessage = "File type not supported - use JPG, PNG, or WEBP"
              break
            case 503:
              errorMessage = "Upload temporarily unavailable in preview mode"
              break
            default:
              errorMessage = errorData.error || errorData.details || `Server error (${response.status})`
          }
        } catch (parseError) {
          console.log("[v0] Could not parse error response:", parseError)

          // Fallback error messages based on status code
          switch (response.status) {
            case 413:
              errorMessage = "File too large - maximum 20MB allowed"
              break
            case 415:
              errorMessage = "File type not supported - use JPG, PNG, or WEBP"
              break
            case 503:
              errorMessage = "Service temporarily unavailable"
              break
            default:
              errorMessage = `Upload failed (${response.status})`
          }
        }

        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log("[v0] Upload successful:", result)

      // Update to analyzing status
      setUploadProgress((prev) =>
        prev.map((item) => (item.file === file ? { ...item, progress: 100, status: "analyzing" } : item)),
      )

      // Simulate analysis time
      setTimeout(() => {
        setUploadProgress((prev) =>
          prev.map((item) => (item.file === file ? { ...item, status: "completed", result: result.photo } : item)),
        )

        // Add to recent photos
        setRecentPhotos((prev) => [result.photo, ...prev.slice(0, 4)])

        // Remove from progress after 3 seconds
        setTimeout(() => {
          setUploadProgress((prev) => prev.filter((item) => item.file !== file))
        }, 3000)
      }, 2000)
    } catch (error) {
      console.error("[v0] File upload error:", error)

      const errorMessage = error instanceof Error ? error.message : "Upload failed"

      setUploadProgress((prev) =>
        prev.map((item) => (item.file === file ? { ...item, status: "error", error: errorMessage } : item)),
      )

      // Show toast notification for error
      if (typeof window !== "undefined") {
        alert(`Upload failed: ${errorMessage}`)
      }
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      handleFileSelect(e.dataTransfer.files)
    },
    [handleFileSelect],
  )

  const removeUpload = (file: File) => {
    setUploadProgress((prev) => prev.filter((item) => item.file !== file))
  }

  const startCamera = async () => {
    try {
      console.log("[v0] Requesting camera access...")

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported in this browser")
      }

      const permissions = await navigator.permissions.query({ name: "camera" as any })
      console.log("[v0] Camera permission status:", permissions.state)

      if (permissions.state === "denied") {
        throw new Error(
          "Camera permission was previously denied. Please enable camera access in your browser settings.",
        )
      }

      let stream: MediaStream | null = null

      try {
        // Try back camera first (mobile)
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        })
      } catch (backCameraError) {
        console.log("[v0] Back camera failed, trying front camera...")
        try {
          // Fallback to front camera
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "user",
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          })
        } catch (frontCameraError) {
          console.log("[v0] Front camera failed, trying any camera...")
          // Final fallback to any available camera
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          })
        }
      }

      if (!stream) {
        throw new Error("Unable to access any camera")
      }

      console.log("[v0] Camera access granted")
      setIsCameraOpen(true)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
        }
      }
    } catch (error) {
      console.error("Error accessing camera:", error)

      if (error instanceof Error) {
        if (error.name === "NotAllowedError" || error.message.includes("denied")) {
          setToast({
            message:
              "Camera permission denied. Please click the camera icon in your browser's address bar and allow camera access, then try again.",
            type: "error",
          })
        } else if (error.name === "NotFoundError") {
          setToast({
            message: "No camera found on this device. Please connect a camera and try again.",
            type: "error",
          })
        } else if (error.name === "NotSupportedError" || error.message.includes("not supported")) {
          setToast({
            message: "Camera not supported on this device or browser. Please try a different browser.",
            type: "error",
          })
        } else if (error.name === "NotReadableError") {
          setToast({
            message:
              "Camera is already in use by another application. Please close other apps using the camera and try again.",
            type: "error",
          })
        } else {
          setToast({
            message: `Camera error: ${error.message}. Please check your camera settings and try again.`,
            type: "error",
          })
        }
      } else {
        setToast({
          message: "Unable to access camera. Please check permissions and try again.",
          type: "error",
        })
      }
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
    }
    setIsCameraOpen(false)
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      const context = canvas.getContext("2d")

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      if (context) {
        context.drawImage(video, 0, 0)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const file = new File([blob], `captured-${Date.now()}.jpg`, { type: "image/jpeg" })
              uploadFile(file)
            }
          },
          "image/jpeg",
          0.8,
        )
      }

      stopCamera()
    }
  }

  const handleBatchUpload = () => {
    batchFileInputRef.current?.click()
  }

  const handleBatchFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length > 0) {
      setSelectedFiles(files)
      setIsBatchMode(true)
      // Upload all files
      files.forEach((file) => uploadFile(file))
    }
  }

  const processBatchAnalysis = async () => {
    if (selectedFiles.length === 0) return

    try {
      const formData = new FormData()
      selectedFiles.forEach((file, index) => {
        formData.append(`files`, file)
      })
      formData.append("userId", "1")
      formData.append("source", "batch-upload")
      formData.append("tags", "batch-analysis,crop-monitoring")

      const response = await fetch("/api/photos/batch", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Batch analysis failed")
      }

      const result = await response.json()

      // Update recent photos with batch results
      setRecentPhotos((prev) => [...result.photos, ...prev.slice(0, 10 - result.photos.length)])
      setIsBatchMode(false)
      setSelectedFiles([])
    } catch (error) {
      console.error("Batch analysis error:", error)
      alert("Batch analysis failed. Please try again.")
    }
  }

  const [droneFleet, setDroneFleet] = useState([
    {
      id: "AGRI-01",
      status: "Active",
      battery: 85,
      location: "North Field",
      task: "Disease Survey",
      flightTime: "23 min",
    },
    { id: "AGRI-02", status: "Charging", battery: 100, location: "Base Station", task: "Standby", flightTime: "0 min" },
    {
      id: "AGRI-03",
      status: "Active",
      battery: 67,
      location: "South Field",
      task: "Environmental Scan",
      flightTime: "18 min",
    },
    {
      id: "AGRI-04",
      status: "Maintenance",
      battery: 45,
      location: "Service Bay",
      task: "Sensor Calibration",
      flightTime: "0 min",
    },
  ])

  const [droneLoading, setDroneLoading] = useState(false)
  const [showMissionPlanner, setShowMissionPlanner] = useState(false)
  const [showFleetAnalytics, setShowFleetAnalytics] = useState(false)
  const [missionType, setMissionType] = useState("survey")
  const [selectedDrone, setSelectedDrone] = useState("")
  const [scheduledTime, setScheduledTime] = useState(new Date().toISOString().slice(0, 16))
  const [missionLoading, setMissionLoading] = useState(false)
  const [fleetAnalytics, setFleetAnalytics] = useState(null)

  const handleTrackDrone = (droneId: string) => {
    setDroneLoading(true)
    setTimeout(() => {
      setDroneLoading(false)
      toast({
        title: "Tracking Started",
        description: `Tracking drone ${droneId}.`,
      })
    }, 1500)
  }

  const handleViewDroneFeed = (droneId: string) => {
    setDroneLoading(true)
    setTimeout(() => {
      setDroneLoading(false)
      toast({
        title: "Live Feed",
        description: `Viewing live feed from drone ${droneId}.`,
      })
    }, 1500)
  }

  const handleEmergencyReturn = (droneId: string) => {
    setDroneLoading(true)
    setTimeout(() => {
      setDroneLoading(false)
      setDroneFleet((prev) =>
        prev.map((drone) =>
          drone.id === droneId ? { ...drone, status: "Returning", task: "Returning to Base" } : drone,
        ),
      )
      toast({
        title: "Emergency Return Initiated",
        description: `Drone ${droneId} is returning to base.`,
      })
    }, 2000)
  }

  const handleStartSurvey = async () => {
    setDroneLoading(true)
    try {
      console.log("[v0] Starting aerial survey...")
      const response = await fetch("/api/drone/aerial-survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: 1,
          surveyType: "comprehensive",
          area: "Field A",
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Aerial Survey Started",
          description: `Survey initiated with ${result.surveyData.dronesAssigned} drones. ETA: ${result.surveyData.estimatedDuration}`,
        })
        console.log("[v0] Aerial survey started successfully:", result)
      } else {
        throw new Error("Survey initiation failed")
      }
    } catch (error) {
      console.error("[v0] Error starting aerial survey:", error)
      toast({
        title: "Survey Failed",
        description: "Could not start aerial survey. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDroneLoading(false)
    }
  }

  const handleScheduleMission = () => {
    setShowMissionPlanner(true)
  }

  const handleFleetAnalytics = async () => {
    setShowFleetAnalytics(true)
    try {
      const response = await fetch("/api/drone/analytics?userId=1&timeRange=30", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
      if (response.ok) {
        const data = await response.json()
        setFleetAnalytics(data)
        console.log("[v0] Fleet analytics loaded successfully:", data)
      } else {
        console.error("[v0] Failed to fetch fleet analytics - Response not OK:", response.status)
        toast({
          title: "Error",
          description: "Failed to fetch fleet analytics.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error fetching fleet analytics:", error)
      toast({
        title: "Error",
        description: "Failed to fetch fleet analytics.",
        variant: "destructive",
      })
    }
  }

  const handleCreateMission = () => {
    setMissionLoading(true)
    setTimeout(() => {
      setMissionLoading(false)
      setShowMissionPlanner(false)
      toast({
        title: "Mission Scheduled",
        description: `New mission scheduled for ${missionType} at ${scheduledTime}.`,
      })
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800 relative overflow-hidden">
      <div className="floating-blur w-48 h-48 top-20 right-10 opacity-20"></div>
      <div className="floating-blur w-64 h-64 bottom-20 left-10 opacity-15"></div>

      {/* Header */}
      <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-green-200 dark:border-slate-700 animate-slide-up">
        <div className="max-w-7xl mx-auto mobile-container">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Hub</span>
              </Link>
              <div className="h-6 w-px bg-slate-300 dark:bg-slate-600" />
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
                  <div className="relative">
                    <Leaf className="w-5 h-5 text-primary-foreground" />
                    <Plane className="w-2 h-2 text-primary-foreground absolute -top-0.5 -right-0.5" />
                  </div>
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">Agri-Module</h1>
                  <p className="text-xs text-slate-600 dark:text-slate-400 hidden sm:block">
                    Drone-Powered Crop Monitoring
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/photos"
                className="hidden sm:inline-flex items-center rounded bg-blue-600 text-white px-3 py-1.5 hover:bg-blue-700"
              >
                Photos
              </Link>
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex bg-transparent"
                onClick={handleLaunchDrone}
                disabled={droneLoading}
              >
                {droneLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plane className="w-4 h-4 mr-2" />}
                Launch Drone
              </Button>
              <Button size="sm" className="mobile-button" onClick={() => handleStartSurvey()} disabled={droneLoading}>
                {droneLoading ? (
                  <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" />
                ) : (
                  <Satellite className="w-4 h-4 sm:mr-2" />
                )}
                <span className="hidden sm:inline">Aerial Survey</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto mobile-container py-4 sm:py-8 relative z-10">
        {/* Overview Cards */}
        <div className="mobile-grid lg:grid-cols-4 mb-6 sm:mb-8">
          <Card className="dark:bg-slate-800 dark:border-slate-700 animate-stagger-1 card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-slate-100">Healthy Crops</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">87%</div>
              <p className="text-xs text-muted-foreground dark:text-slate-400">+2% from last week</p>
            </CardContent>
          </Card>

          <Card className="dark:bg-slate-800 dark:border-slate-700 animate-stagger-2 card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-slate-100">At Risk</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">8%</div>
              <p className="text-xs text-muted-foreground dark:text-slate-400">-1% from last week</p>
            </CardContent>
          </Card>

          <Card className="dark:bg-slate-800 dark:border-slate-700 animate-stagger-3 card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-slate-100">Diseased</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">5%</div>
              <p className="text-xs text-muted-foreground dark:text-slate-400">-0.5% from last week</p>
            </CardContent>
          </Card>

          <Card className="dark:bg-slate-800 dark:border-slate-700 animate-stagger-4 card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-slate-100">Drone Flights</CardTitle>
              <Plane className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-slate-100">23</div>
              <p className="text-xs text-muted-foreground dark:text-slate-400">This week</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="detection" className="space-y-6 animate-fade-in">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 dark:bg-slate-800">
            <TabsTrigger value="detection" className="text-xs sm:text-sm">
              Detection
            </TabsTrigger>
            <TabsTrigger value="drone" className="text-xs sm:text-sm">
              Drone
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm hidden sm:block">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="output" className="text-xs sm:text-sm">
              Reports
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs sm:text-sm hidden sm:block">
              History
            </TabsTrigger>
          </TabsList>

          {/* Output & Reports Tab */}
          <TabsContent value="output" className="space-y-6">
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardHeader className="mobile-card">
                <CardTitle className="flex items-center gap-2 dark:text-slate-100">
                  <FileText className="w-5 h-5" />
                  Generated Reports & Analysis
                </CardTitle>
                <CardDescription className="dark:text-slate-300">
                  Comprehensive reports and data outputs from drone missions and AI analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="mobile-card space-y-6">
                {/* Report Generation */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <Button
                    className="h-12 sm:h-16 flex-col gap-2 mobile-button"
                    onClick={generateCropHealthReport}
                    disabled={isGeneratingReport}
                  >
                    {isGeneratingReport ? (
                      <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                    ) : (
                      <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
                    )}
                    <span className="text-xs sm:text-sm">
                      {isGeneratingReport ? "Generating..." : "Generate Crop Health Report"}
                    </span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-12 sm:h-16 flex-col gap-2 bg-transparent mobile-button"
                    onClick={exportAnalyticsData}
                    disabled={isExportingData}
                  >
                    {isExportingData ? (
                      <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                    ) : (
                      <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
                    )}
                    <span className="text-xs sm:text-sm">
                      {isExportingData ? "Exporting..." : "Export Analytics Data"}
                    </span>
                  </Button>
                </div>

                {/* Recent Reports */}
                <div className="space-y-4">
                  <h4 className="font-medium dark:text-slate-100">Recent Reports</h4>
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 gap-3 sm:gap-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium dark:text-slate-100 truncate">{report.title}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            {report.type} • {report.size} • {report.format}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <div className="text-left sm:text-right">
                          <Badge
                            variant="secondary"
                            className={
                              report.status === "Ready"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                            }
                          >
                            {report.status}
                          </Badge>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{report.date}</p>
                        </div>
                        {report.status === "Ready" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-transparent mobile-button"
                            onClick={() => downloadReport(report)}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Data Visualization Outputs */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardHeader className="mobile-card">
                <CardTitle className="dark:text-slate-100">Data Visualization & Maps</CardTitle>
                <CardDescription className="dark:text-slate-300">
                  Visual outputs from drone data collection and analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="mobile-card space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* NDVI Heat Map */}
                  <div className="p-4 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600">
                    <div className="aspect-video bg-gradient-to-br from-green-100 to-yellow-100 dark:from-green-900 dark:to-yellow-900 rounded-lg mb-3 flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-primary mx-auto mb-2" />
                        <p className="text-sm font-medium dark:text-slate-100">NDVI Heat Map</p>
                        <p className="text-xs text-slate-600 dark:text-slate-300">North Field - Latest Scan</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <p className="font-medium dark:text-slate-100">Vegetation Index Map</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">Updated 2 hours ago</p>
                      </div>
                      <Button variant="outline" size="sm" className="bg-transparent mobile-button w-full sm:w-auto">
                        View Full Map
                      </Button>
                    </div>
                  </div>

                  {/* Disease Distribution Map */}
                  <div className="p-4 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600">
                    <div className="aspect-video bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900 dark:to-orange-900 rounded-lg mb-3 flex items-center justify-center">
                      <div className="text-center">
                        <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 mx-auto mb-2" />
                        <p className="text-sm font-medium dark:text-slate-100">Disease Distribution</p>
                        <p className="text-xs text-slate-600 dark:text-slate-300">South Field - Risk Areas</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <p className="font-medium dark:text-slate-100">Disease Risk Map</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">Updated 5 hours ago</p>
                      </div>
                      <Button variant="outline" size="sm" className="bg-transparent mobile-button w-full sm:w-auto">
                        View Analysis
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Export Options */}
                <div className="grid sm:grid-cols-3 gap-3">
                  <Button variant="outline" className="bg-transparent mobile-button">
                    <Camera className="w-4 h-4 mr-2" />
                    Export Images
                  </Button>
                  <Button variant="outline" className="bg-transparent mobile-button">
                    <MapPin className="w-4 h-4 mr-2" />
                    Export Maps
                  </Button>
                  <Button variant="outline" className="bg-transparent mobile-button">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Export Charts
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Treatment Recommendations Output */}
            <Card>
              <CardHeader>
                <CardTitle>AI Treatment Recommendations</CardTitle>
                <CardDescription>Actionable insights and treatment plans generated from drone data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-green-800">Optimal Irrigation Schedule</h4>
                      <p className="text-sm text-green-700 mt-1">
                        Based on soil moisture analysis, increase irrigation in zones 3-5 by 15% for next 7 days.
                      </p>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" className="bg-transparent">
                          Download Schedule
                        </Button>
                        <Button size="sm" variant="outline" className="bg-transparent">
                          Set Reminders
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-yellow-800">Fertilization Recommendations</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        NDVI analysis indicates nitrogen deficiency in northwest quadrant. Apply 40kg/ha nitrogen
                        fertilizer.
                      </p>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" className="bg-transparent">
                          View Application Map
                        </Button>
                        <Button size="sm" variant="outline" className="bg-transparent">
                          Calculate Costs
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-blue-800">Harvest Timing Prediction</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Crop maturity analysis suggests optimal harvest window: March 15-22. Expected yield: 8.2
                        tons/hectare.
                      </p>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" className="bg-transparent">
                          Export Forecast
                        </Button>
                        <Button size="sm" variant="outline" className="bg-transparent">
                          Schedule Harvest
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Disease Detection Tab */}
          <TabsContent value="detection" className="space-y-6">
            <Card className="dark:bg-slate-800 dark:border-slate-700 animate-scale-in card-hover">
              <CardHeader className="mobile-card">
                <CardTitle className="flex items-center gap-2 dark:text-slate-100">
                  <Camera className="w-5 h-5" />
                  AI Disease Detection
                </CardTitle>
                <CardDescription className="dark:text-slate-300">
                  Upload or capture images of your crops for instant disease analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="mobile-card space-y-6">
                <div
                  className={`border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-all duration-300 ${
                    isDragOver
                      ? "border-primary bg-primary/10 dark:bg-primary/20 scale-105"
                      : "border-green-300 dark:border-green-600 bg-green-50/50 dark:bg-green-900/20"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 dark:bg-primary/20 rounded-full animate-bounce-in">
                      <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                        Upload Crop Image
                      </h3>
                      <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm sm:text-base">
                        Drag and drop images or click to browse your files
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-center justify-center">
                        <Button className="mobile-button" onClick={() => fileInputRef.current?.click()}>
                          <Upload className="w-4 h-4 mr-2" />
                          Choose Files
                        </Button>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Max 10MB • JPG, PNG, WEBP</p>
                      </div>
                    </div>
                  </div>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files)}
                  />
                </div>

                {uploadProgress.length > 0 && (
                  <div className="space-y-3 animate-slide-up">
                    <h4 className="font-medium text-slate-900 dark:text-slate-100">Upload Progress</h4>
                    {uploadProgress.map((progress) => (
                      <div
                        key={`${progress.file.name}-${progress.file.size}-${(progress.file as any)?.lastModified ?? ""}`}
                        className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                      >
                        <div className="flex justify-between text-sm">
                          <span className="truncate">{progress.file.name}</span>
                          <span>{progress.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-300 progress-animate loading-shimmer"
                            style={{ width: `${progress.progress}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                          <span>Status: {progress.status}</span>
                          {progress.error && <span className="text-red-600">Error: {progress.error}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <Button variant="outline" className="h-12 bg-transparent mobile-button" onClick={startCamera}>
                    <Camera className="w-4 h-4 mr-2" />
                    Take Photo
                  </Button>
                  <Button variant="outline" className="h-12 bg-transparent mobile-button" onClick={handleBatchUpload}>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Batch Analysis
                  </Button>
                </div>

                {isCameraOpen && (
                  <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 max-w-md w-full mx-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold dark:text-white">Capture Photo</h3>
                        <Button variant="ghost" size="sm" onClick={stopCamera}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="relative">
                        <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg" />
                        <canvas ref={canvasRef} className="hidden" />
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button onClick={capturePhoto} className="flex-1">
                          <Camera className="w-4 h-4 mr-2" />
                          Capture
                        </Button>
                        <Button variant="outline" onClick={stopCamera} className="flex-1 bg-transparent">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <input
                  type="file"
                  ref={batchFileInputRef}
                  onChange={handleBatchFileSelect}
                  accept="image/*"
                  multiple
                  className="hidden"
                />

                {isBatchMode && selectedFiles.length > 0 && (
                  <Card className="dark:bg-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium dark:text-white">Batch Analysis ({selectedFiles.length} files)</h4>
                        <Button size="sm" onClick={processBatchAnalysis}>
                          Start Analysis
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="dark:text-slate-300">{file.name}</span>
                            <span className="text-slate-500">({(file.size / 1024 / 1024).toFixed(1)}MB)</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            {/* Recent Detection Results */}
            <Card className="dark:bg-slate-800 dark:border-slate-700 animate-slide-up card-hover">
              <CardHeader className="mobile-card">
                <CardTitle className="flex items-center gap-2 dark:text-slate-100">
                  <Camera className="w-5 h-5" />
                  Recent Detection Results
                </CardTitle>
                <CardDescription className="dark:text-slate-300">Latest crop health assessments</CardDescription>
              </CardHeader>

              <CardContent className="mobile-card">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {recentPhotos.length} recent analysis results
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchRecentPhotos}
                    disabled={isLoadingRecentPhotos}
                    className="h-8 bg-transparent"
                  >
                    {isLoadingRecentPhotos ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    <span className="ml-2">Refresh</span>
                  </Button>
                </div>

                {recentPhotos.length > 0 ? (
                  <div className="space-y-3">
                    {recentPhotos.map((photo, index) => (
                      <div
                        key={photo.id}
                        className={`flex items-center justify-between p-4 border rounded-lg dark:border-slate-600 dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all duration-300 card-hover animate-stagger-${(index % 4) + 1}`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                              photo.analysisStatus === "completed"
                                ? "bg-green-100 dark:bg-green-900 animate-bounce-in"
                                : photo.analysisStatus === "analyzing"
                                  ? "bg-yellow-100 dark:bg-yellow-900 pulse-ring"
                                  : "bg-red-100 dark:bg-red-900"
                            }`}
                          >
                            {photo.analysisStatus === "completed" && (
                              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                            )}
                            {photo.analysisStatus === "analyzing" && (
                              <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 animate-spin" />
                            )}
                            {photo.analysisStatus === "error" && (
                              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium dark:text-slate-100 truncate">{photo.originalName}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                              Status: {photo.analysisStatus} • {new Date(photo.createdAt).toLocaleTimeString()}
                              {typeof photo.analysisResults?.confidence !== "undefined" && (
                                <span>
                                  {" "}• Confidence:{" "}
                                  {photo.analysisResults.confidence > 1
                                    ? Math.round(photo.analysisResults.confidence)
                                    : Math.round(photo.analysisResults.confidence * 100)}
                                  %
                                </span>
                              )}
                            </p>
                            {photo.analysisResults?.diseaseName && (
                              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                Disease: {photo.analysisResults.diseaseName}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={`flex-shrink-0 ${
                              photo.analysisStatus === "completed"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                : photo.analysisStatus === "analyzing"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                            }`}
                          >
                            {photo.analysisStatus === "completed" && "Analyzed"}
                            {photo.analysisStatus === "analyzing" && "Processing"}
                            {photo.analysisStatus === "error" && "Failed"}
                          </Badge>
                          {photo.analysisStatus === "completed" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                alert(`Analysis Results:\n${JSON.stringify(photo.analysisResults, null, 2)}`)
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                          {photo.analysisStatus !== "completed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 bg-transparent"
                              onClick={async () => {
                                try {
                                  const form = new FormData()
                                  form.append("photoId", String(photo.id))
                                  const resp = await fetch("/api/photos/analyze", { method: "POST", body: form })
                                  if (!resp.ok) throw new Error(`Analyze failed (${resp.status})`)
                                  await fetchRecentPhotos()
                                } catch (e) {
                                  alert(e instanceof Error ? e.message : "Analyze failed")
                                }
                              }}
                            >
                              Analyze
                            </Button>
                          )}
                          {photo.analysisStatus === "completed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 bg-transparent"
                              onClick={() => downloadPhotoPdf(photo.id, photo.filename)}
                            >
                              <Download className="w-4 h-4 mr-1" /> PDF
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400 animate-fade-in">
                    <Camera className="w-12 h-12 mx-auto mb-3 opacity-50 animate-float" />
                    <p>No recent photos found. Upload some images to get started!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Drone Monitoring Tab */}
          <TabsContent value="drone" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plane className="w-5 h-5" />
                  Autonomous Drone Fleet
                </CardTitle>
                <CardDescription>Real-time crop monitoring and data collection via autonomous drones</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Drone Status Grid */}
                <div className="grid md:grid-cols-2 gap-4">
                  {droneFleet.map((drone) => (
                    <div key={drone.id} className="p-4 border rounded-lg bg-white dark:bg-slate-800">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Plane className="w-4 h-4 text-primary" />
                          <span className="font-medium">{drone.id}</span>
                        </div>
                        <Badge
                          variant="secondary"
                          className={
                            drone.status === "Active"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : drone.status === "Charging"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          }
                        >
                          {drone.status}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Battery:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{drone.battery}%</span>
                            <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  drone.battery > 60
                                    ? "bg-green-500"
                                    : drone.battery > 30
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                                }`}
                                style={{ width: `${drone.battery}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Location:</span>
                          <span className="font-medium">{drone.location}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Task:</span>
                          <span className="font-medium">{drone.task}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Flight Time:</span>
                          <span className="font-medium">{drone.flightTime}</span>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-transparent"
                          onClick={() => handleTrackDrone(drone.id)}
                          disabled={droneLoading}
                        >
                          <MapPin className="w-3 h-3 mr-1" />
                          Track
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-transparent"
                          onClick={() => handleViewDroneFeed(drone.id)}
                          disabled={droneLoading}
                        >
                          <Camera className="w-3 h-3 mr-1" />
                          Live Feed
                        </Button>
                      </div>
                      {drone.status === "Active" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => handleEmergencyReturn(drone.id)}
                          disabled={droneLoading}
                        >
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Emergency Return
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Mission Control */}
                <div className="grid md:grid-cols-3 gap-4">
                  <Button className="h-16 flex-col gap-2" onClick={() => handleStartSurvey()} disabled={droneLoading}>
                    {droneLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Satellite className="w-6 h-6" />}
                    <span>Start Aerial Survey</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-16 flex-col gap-2 bg-transparent"
                    onClick={() => handleScheduleMission()}
                    disabled={droneLoading}
                  >
                    <Calendar className="w-6 h-6" />
                    <span>Schedule Mission</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-16 flex-col gap-2 bg-transparent"
                    onClick={() => handleFleetAnalytics()}
                    disabled={droneLoading}
                  >
                    <BarChart3 className="w-6 h-6" />
                    <span>Fleet Analytics</span>
                  </Button>
                </div>

                {/* Mission Planning Modal */}
                {showMissionPlanner && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Plan Mission</h3>
                        <Button variant="ghost" size="sm" onClick={() => setShowMissionPlanner(false)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Mission Type</label>
                          <select
                            className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600"
                            value={missionType}
                            onChange={(e) => setMissionType(e.target.value)}
                          >
                            <option value="survey">Crop Survey</option>
                            <option value="monitoring">Disease Monitoring</option>
                            <option value="spraying">Precision Spraying</option>
                            <option value="mapping">Field Mapping</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Drone Selection</label>
                          <select
                            className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600"
                            value={selectedDrone}
                            onChange={(e) => setSelectedDrone(e.target.value)}
                          >
                            <option value="">Auto-assign</option>
                            {droneFleet
                              .filter((d) => d.status === "Charging" || d.status === "Standby")
                              .map((drone) => (
                                <option key={drone.id} value={drone.id}>
                                  {drone.id} - {drone.battery}%
                                </option>
                              ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Scheduled Time</label>
                          <input
                            type="datetime-local"
                            className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600"
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                          />
                        </div>
                        <div className="flex gap-2 pt-4">
                          <Button className="flex-1" onClick={handleCreateMission} disabled={missionLoading}>
                            {missionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Create Mission
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setShowMissionPlanner(false)}
                            disabled={missionLoading}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Fleet Analytics Modal */}
                {showFleetAnalytics && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Fleet Analytics</h3>
                        <Button variant="ghost" size="sm" onClick={() => setShowFleetAnalytics(false)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      {fleetAnalytics ? (
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                              <div className="text-2xl font-bold text-primary">
                                {fleetAnalytics.overview.totalFlights}
                              </div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">Total Flights</div>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                              <div className="text-2xl font-bold text-primary">
                                {Math.round(fleetAnalytics.overview.totalFlightTime / 3600)}h
                              </div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">Flight Time</div>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                              <div className="text-2xl font-bold text-primary">
                                {fleetAnalytics.overview.totalAreaCovered.toFixed(1)}
                              </div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">Hectares Covered</div>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                              <div className="text-2xl font-bold text-primary">
                                {fleetAnalytics.overview.totalPhotos}
                              </div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">Photos Captured</div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-3">Drone Performance</h4>
                            <div className="space-y-2">
                              {fleetAnalytics.dronePerformance.map((drone, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"
                                >
                                  <div className="flex items-center gap-3">
                                    <Plane className="w-4 h-4 text-primary" />
                                    <span className="font-medium">{drone.droneId}</span>
                                  </div>
                                  <div className="flex gap-4 text-sm">
                                    <span>{drone.flights} flights</span>
                                    <span>{Math.round(drone.totalFlightTime / 3600)}h</span>
                                    <span>{drone.totalAreaCovered.toFixed(1)} ha</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {fleetAnalytics.alerts.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-3 text-yellow-600 dark:text-yellow-400">Recent Alerts</h4>
                              <div className="space-y-2">
                                {fleetAnalytics.alerts.slice(0, 5).map((alert, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg"
                                  >
                                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                    <div className="flex-1">
                                      <div className="font-medium">{alert.alertType}</div>
                                      <div className="text-sm text-slate-600 dark:text-slate-400">
                                        {alert.droneId} - {alert.missionType}
                                      </div>
                                    </div>
                                    <div className="text-sm text-slate-500">
                                      {new Date(alert.date).toLocaleDateString()}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin mr-2" />
                          Loading analytics...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Crop Health Analytics</CardTitle>
                <CardDescription>Insights and trends from your farm data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Disease Distribution</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Healthy</span>
                          <span>87%</span>
                        </div>
                        <Progress value={87} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Early Blight</span>
                          <span>8%</span>
                        </div>
                        <Progress value={8} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Rust Disease</span>
                          <span>5%</span>
                        </div>
                        <Progress value={5} className="h-2" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Weekly Trends</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Healthy Crops</span>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-600">+2%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Disease Detection</span>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
                          <span className="text-sm text-red-600">-1.5%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Scan Frequency</span>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-primary" />
                          <span className="text-sm text-primary">+15%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Flight History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Drone Flight History</CardTitle>
                <CardDescription>Complete record of drone missions and data collection</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      mission: "Disease Survey - North Field",
                      duration: "45 min",
                      area: "12.5 acres",
                      time: "2 hours ago",
                      images: 342,
                    },
                    {
                      mission: "Environmental Scan - South Field",
                      duration: "38 min",
                      area: "8.2 acres",
                      time: "5 hours ago",
                      images: 287,
                    },
                    {
                      mission: "Crop Health Assessment",
                      duration: "52 min",
                      area: "15.1 acres",
                      time: "1 day ago",
                      images: 456,
                    },
                    {
                      mission: "Irrigation Monitoring",
                      duration: "29 min",
                      area: "6.8 acres",
                      time: "2 days ago",
                      images: 198,
                    },
                    {
                      mission: "Pest Detection Survey",
                      duration: "41 min",
                      area: "11.3 acres",
                      time: "3 days ago",
                      images: 321,
                    },
                  ].map((flight) => (
                    <div key={`${flight.mission}-${flight.time}`} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Plane className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium">{flight.mission}</p>
                          <p className="text-sm text-slate-600">
                            {flight.duration} • {flight.area} • {flight.images} images
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-600">{flight.time}</p>
                        <Button variant="outline" size="sm" className="mt-1 bg-transparent">
                          View Data
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {toastMessage && (
        <div
          className={`fixed bottom-4 right-4 z-50 p-4 rounded-md shadow-lg ${
            toastMessage.type === "success"
              ? "bg-green-100 text-green-800"
              : toastMessage.type === "error"
                ? "bg-red-100 text-red-800"
                : "bg-blue-100 text-blue-800"
          }`}
        >
          {toastMessage.message}
        </div>
      )}

      {/* Footer */}
      {/* <footer className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-t border-green-200 dark:border-slate-700 py-6 text-center text-slate-600 dark:text-slate-400">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} Agri-Module. All rights reserved.
        </p>
      </footer> */}
    </div>
  )
}

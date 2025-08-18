"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"

async function fetchPhoto(id: string) {
  const res = await fetch(`/api/photos/${id}`, { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to load photo")
  return res.json()
}

async function analyzePhoto(id: string, filePath?: string) {
  const form = new FormData()
  form.append("photoId", id)
  // We rely on backend to find on-disk file path by id when only id is provided
  const res = await fetch(`/api/photos/analyze`, { method: "POST", body: form })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || "Failed to analyze photo")
  }
  return res.json()
}

export default function PhotoDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [photo, setPhoto] = useState<any>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)
  const [analyzeResult, setAnalyzeResult] = useState<any>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchPhoto(id)
      setPhoto(data.photo)
    } catch (e: any) {
      setError(e?.message || "Failed to load photo")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const onAnalyze = async () => {
    try {
      setAnalyzing(true)
      setAnalyzeError(null)
      setAnalyzeResult(null)
      const res = await analyzePhoto(id)
      setAnalyzeResult(res)
      // Refresh details to show updated analysisResults from DB
      await load()
    } catch (e: any) {
      setAnalyzeError(e?.message || "Failed to analyze photo")
    } finally {
      setAnalyzing(false)
    }
  }

  const onDownloadPdf = async () => {
    try {
      const res = await fetch(`/api/photos/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId: id, format: "pdf" }),
      })
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || "Failed to download report")
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${photo?.filename || id}_analysis.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      setAnalyzeError(e?.message || "Failed to download report")
    }
  }

  if (loading) return <main className="p-6">Loading...</main>
  if (error) return <main className="p-6 text-red-600">{error}</main>
  if (!photo) return <main className="p-6">No photo found.</main>

  const ar = photo.analysisResults
  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{photo.originalName || photo.filename}</h1>
          <div className="text-sm text-gray-600">Uploaded: {new Date(photo.createdAt).toLocaleString()}</div>
          <div className="text-sm text-gray-600">Status: {photo.analysisStatus || "unknown"}</div>
        </div>
        <button
          onClick={onAnalyze}
          className="inline-flex items-center justify-center rounded bg-green-600 px-3 py-1.5 text-white hover:bg-green-700 disabled:opacity-50"
          disabled={analyzing}
        >
          {analyzing ? "Analyzing..." : "Analyze with Plant.id"}
        </button>
      </div>

      <div className="rounded border p-4">
        <h2 className="font-medium mb-2">Analysis Results</h2>
        {!ar ? (
          <div className="text-gray-600">No analysis yet. Click "Analyze with Plant.id" to start.</div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {ar.cropName && <div><span className="font-medium">Crop:</span> {ar.cropName}</div>}
            {ar.diseaseName && <div><span className="font-medium">Disease:</span> {ar.diseaseName}</div>}
            {ar.severity && <div><span className="font-medium">Severity:</span> {ar.severity}</div>}
            {ar.confidence != null && <div><span className="font-medium">Confidence:</span> {ar.confidence}%</div>}
            {Array.isArray(ar.symptoms) && ar.symptoms.length > 0 && (
              <div>
                <div className="font-medium">Symptoms:</div>
                <ul className="list-disc pl-6 text-sm text-gray-800">
                  {ar.symptoms.map((s: string, idx: number) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {Array.isArray(ar.treatments) && ar.treatments.length > 0 && (
              <div>
                <div className="font-medium">Treatments:</div>
                <ul className="list-disc pl-6 text-sm text-gray-800">
                  {ar.treatments.map((t: string, idx: number) => (
                    <li key={idx}>{t}</li>
                  ))}
                </ul>
              </div>
            )}
            {Array.isArray(ar.recommendations) && ar.recommendations.length > 0 && (
              <div>
                <div className="font-medium">Recommendations:</div>
                <ul className="list-disc pl-6 text-sm text-gray-800">
                  {ar.recommendations.map((r: string, idx: number) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onDownloadPdf}
          className="inline-flex items-center justify-center rounded bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
        >
          Download PDF report
        </button>
      </div>

      {analyzeError && <div className="text-red-600">{analyzeError}</div>}
      {analyzeResult?.message && <div className="text-green-700">{analyzeResult.message}</div>}
    </main>
  )
}


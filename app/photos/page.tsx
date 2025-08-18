import Link from "next/link"

async function fetchRecentPhotos() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/photos/recent`, {
    cache: "no-store",
  })
  if (!res.ok) {
    return { photos: [] }
  }
  return res.json()
}

export default async function PhotosPage() {
  const data = await fetchRecentPhotos()
  const photos = data?.photos || []

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Recent Photos</h1>
      {photos.length === 0 ? (
        <p className="text-gray-600">No photos found.</p>
      ) : (
        <ul className="divide-y divide-gray-200 rounded border">
          {photos.map((p: any) => (
            <li key={p.id} className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-medium">{p.originalName || p.filename}</div>
                  <div className="text-sm text-gray-500">Status: {p.analysisStatus || "unknown"}</div>
                  {p.analysisResults?.diseaseName && (
                    <div className="text-sm text-gray-700">Disease: {p.analysisResults.diseaseName}</div>
                  )}
                </div>
                <Link
                  href={`/photos/${p.id}`}
                  className="inline-flex items-center justify-center rounded bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
                >
                  View details
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}


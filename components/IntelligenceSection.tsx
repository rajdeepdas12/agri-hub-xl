import Image from "next/image"

export default function IntelligenceSection() {
  return (
    <section className="text-center py-10">
      <Image
        src="https://static.vecteezy.com/system/resources/previews/031/696/054/non_2x/sprawling-agricultural-farm-featuring-fields-of-crops-ai-generated-photo.jpg"
        alt="Agricultural Intelligence"
        width={600}
        height={400}
        className="mx-auto rounded-2xl shadow-lg"
        priority
      />
      <h2 className="text-3xl font-bold mt-6">Complete Agricultural Intelligence</h2>
      <p className="mt-4 text-gray-600">
        Our platform provides end-to-end solutions for crop analysis, monitoring, and insights.
      </p>
    </section>
  )
}


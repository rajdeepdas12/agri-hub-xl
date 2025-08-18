export interface WeatherApiResponse {
  temperature: number
  humidity: number
  windSpeed: number
  precipitation: number
  forecast: Array<{
    date: string
    temp: number
    condition: string
  }>
}

export interface SoilApiResponse {
  ph: number
  nitrogen: number
  phosphorus: number
  potassium: number
  moisture: number
  temperature: number
}

export interface MarketApiResponse {
  crop: string
  price: number
  currency: string
  market: string
  trend: "up" | "down" | "stable"
  lastUpdated: string
}

export interface PestApiResponse {
  pestType: string
  riskLevel: "low" | "medium" | "high"
  treatment: string
  affectedCrops: string[]
}

// Demo API Keys - Replace with real keys in production
const EXTERNAL_API_KEYS = {
  weather: process.env.NEXT_PUBLIC_WEATHER_API_KEY || "AIzaSyDPHkQqGg-SKXd0PitnSwD4qzWhGnLiWc",
  soil: process.env.NEXT_PUBLIC_SOIL_API_KEY || "AIzaSyDPHkQqGg-SKXd0PitnSwD4qzWhGnLiWc",
  market: process.env.NEXT_PUBLIC_MARKET_API_KEY || "AIzaSyDPHkQqGg-SKXd0PitnSwD4qzWhGnLiWc",
  pest: process.env.NEXT_PUBLIC_PEST_API_KEY || "AIzaSyDPHkQqGg-SKXd0PitnSwD4qzWhGnLiWc",
  satellite: process.env.NEXT_PUBLIC_SATELLITE_API_KEY || "AIzaSyDPHkQqGg-SKXd0PitnSwD4qzWhGnLiWc",
}

// Base configuration for external APIs
const EXTERNAL_API_CONFIG = {
  weather: {
    baseUrl: process.env.NEXT_PUBLIC_WEATHER_API_URL || "https://api.weatherservice.com/v1",
    timeout: 10000,
  },
  soil: {
    baseUrl: process.env.NEXT_PUBLIC_SOIL_API_URL || "https://api.soildata.com/v2",
    timeout: 15000,
  },
  market: {
    baseUrl: process.env.NEXT_PUBLIC_MARKET_API_URL || "https://api.agrimarket.com/v1",
    timeout: 8000,
  },
  pest: {
    baseUrl: process.env.NEXT_PUBLIC_PEST_API_URL || "https://api.pestcontrol.com/v1",
    timeout: 12000,
  },
  satellite: {
    baseUrl: process.env.NEXT_PUBLIC_SATELLITE_API_URL || "https://api.satellite.com/v3",
    timeout: 20000,
  },
}

// Generic external API request function
async function makeExternalApiRequest<T>(
  service: keyof typeof EXTERNAL_API_KEYS,
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const config = EXTERNAL_API_CONFIG[service]
  const apiKey = EXTERNAL_API_KEYS[service]

  const url = `${config.baseUrl}${endpoint}`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), config.timeout)

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`${service} API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`${service} API request timeout`)
    }
    throw error
  }
}

// Weather API functions
export async function getWeatherData(latitude: number, longitude: number): Promise<WeatherApiResponse> {
  // Demo data for testing
  if (EXTERNAL_API_KEYS.weather.includes("AIzaSyDPHkQqGg-SKXd0PitnSwD4qzWhGnLiWc")) {
    return {
      temperature: 24,
      humidity: 65,
      windSpeed: 12,
      precipitation: 0.2,
      forecast: [
        { date: "2024-01-16", temp: 26, condition: "sunny" },
        { date: "2024-01-17", temp: 23, condition: "cloudy" },
        { date: "2024-01-18", temp: 21, condition: "rainy" },
      ],
    }
  }

  return makeExternalApiRequest<WeatherApiResponse>("weather", `/weather?lat=${latitude}&lon=${longitude}`)
}

export async function getWeatherForecast(latitude: number, longitude: number, days = 7): Promise<WeatherApiResponse> {
  if (EXTERNAL_API_KEYS.weather.includes("demo")) {
    return {
      temperature: 24,
      humidity: 65,
      windSpeed: 12,
      precipitation: 0.2,
      forecast: Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        temp: 20 + Math.random() * 10,
        condition: ["sunny", "cloudy", "rainy"][Math.floor(Math.random() * 3)],
      })),
    }
  }

  return makeExternalApiRequest<WeatherApiResponse>(
    "weather",
    `/forecast?lat=${latitude}&lon=${longitude}&days=${days}`,
  )
}

// Soil API functions
export async function getSoilData(fieldId: string): Promise<SoilApiResponse> {
  if (EXTERNAL_API_KEYS.soil.includes("demo")) {
    return {
      ph: 6.5,
      nitrogen: 45,
      phosphorus: 32,
      potassium: 28,
      moisture: 35,
      temperature: 18,
    }
  }

  return makeExternalApiRequest<SoilApiResponse>("soil", `/analysis/${fieldId}`)
}

export async function getSoilHistory(fieldId: string, days = 30): Promise<SoilApiResponse[]> {
  if (EXTERNAL_API_KEYS.soil.includes("demo")) {
    return Array.from({ length: days }, () => ({
      ph: 6.0 + Math.random() * 1.5,
      nitrogen: 40 + Math.random() * 20,
      phosphorus: 25 + Math.random() * 15,
      potassium: 20 + Math.random() * 20,
      moisture: 30 + Math.random() * 20,
      temperature: 15 + Math.random() * 10,
    }))
  }

  return makeExternalApiRequest<SoilApiResponse[]>("soil", `/history/${fieldId}?days=${days}`)
}

// Market API functions
export async function getMarketPrices(crop: string): Promise<MarketApiResponse> {
  if (EXTERNAL_API_KEYS.market.includes("demo")) {
    return {
      crop,
      price: 150 + Math.random() * 100,
      currency: "USD",
      market: "Chicago Board of Trade",
      trend: ["up", "down", "stable"][Math.floor(Math.random() * 3)] as "up" | "down" | "stable",
      lastUpdated: new Date().toISOString(),
    }
  }

  return makeExternalApiRequest<MarketApiResponse>("market", `/prices/${crop}`)
}

export async function getMarketTrends(crop: string, period = "30d"): Promise<MarketApiResponse[]> {
  if (EXTERNAL_API_KEYS.market.includes("demo")) {
    return Array.from({ length: 30 }, (_, i) => ({
      crop,
      price: 150 + Math.random() * 100,
      currency: "USD",
      market: "Chicago Board of Trade",
      trend: ["up", "down", "stable"][Math.floor(Math.random() * 3)] as "up" | "down" | "stable",
      lastUpdated: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    }))
  }

  return makeExternalApiRequest<MarketApiResponse[]>("market", `/trends/${crop}?period=${period}`)
}

// Pest Control API functions
export async function getPestAlerts(region: string): Promise<PestApiResponse[]> {
  if (EXTERNAL_API_KEYS.pest.includes("demo")) {
    return [
      {
        pestType: "Aphids",
        riskLevel: "medium",
        treatment: "Apply neem oil spray",
        affectedCrops: ["wheat", "corn", "soybeans"],
      },
      {
        pestType: "Corn Borer",
        riskLevel: "high",
        treatment: "Use Bt corn varieties",
        affectedCrops: ["corn"],
      },
    ]
  }

  return makeExternalApiRequest<PestApiResponse[]>("pest", `/alerts/${region}`)
}

export async function getPestTreatment(pestType: string): Promise<PestApiResponse> {
  if (EXTERNAL_API_KEYS.pest.includes("demo")) {
    return {
      pestType,
      riskLevel: "medium",
      treatment: "Apply integrated pest management techniques",
      affectedCrops: ["wheat", "corn", "soybeans", "rice"],
    }
  }

  return makeExternalApiRequest<PestApiResponse>("pest", `/treatment/${pestType}`)
}

// Satellite API functions
export async function getSatelliteImagery(latitude: number, longitude: number, zoom = 14): Promise<string> {
  if (EXTERNAL_API_KEYS.satellite.includes("demo")) {
    return `/placeholder.svg?height=400&width=400&query=satellite view of agricultural field`
  }

  const response = await makeExternalApiRequest<{ imageUrl: string }>(
    "satellite",
    `/imagery?lat=${latitude}&lon=${longitude}&zoom=${zoom}`,
  )

  return response.imageUrl
}

export async function getNDVIData(
  latitude: number,
  longitude: number,
  startDate: string,
  endDate: string,
): Promise<any> {
  if (EXTERNAL_API_KEYS.satellite.includes("demo")) {
    return {
      ndviValues: Array.from({ length: 10 }, () => 0.3 + Math.random() * 0.5),
      dates: Array.from(
        { length: 10 },
        (_, i) => new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      ),
      averageNDVI: 0.65,
    }
  }

  return makeExternalApiRequest("satellite", `/ndvi?lat=${latitude}&lon=${longitude}&start=${startDate}&end=${endDate}`)
}

// Utility function to check API key status
export function checkApiKeyStatus(): Record<string, boolean> {
  return Object.keys(EXTERNAL_API_KEYS).reduce(
    (status, service) => {
      status[service] = !EXTERNAL_API_KEYS[service as keyof typeof EXTERNAL_API_KEYS].includes("demo")
      return status
    },
    {} as Record<string, boolean>,
  )
}

// Function to validate all API connections
export async function validateApiConnections(): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {}

  for (const service of Object.keys(EXTERNAL_API_KEYS)) {
    try {
      // Simple health check endpoint
      await makeExternalApiRequest(service as keyof typeof EXTERNAL_API_KEYS, "/health")
      results[service] = true
    } catch (error) {
      results[service] = false
    }
  }

  return results
}

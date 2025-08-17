"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Leaf, Camera, TrendingUp, Plane, Satellite, MapPin, BarChart3, FileText, Menu, Loader2 } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { useState } from "react"

export default function HomePage() {
  const [showSignIn, setShowSignIn] = useState(false)
  const [signInData, setSignInData] = useState({ email: "", password: "" })
  const [signInLoading, setSignInLoading] = useState(false)
  const [showReport, setShowReport] = useState(false)

  const handleSignIn = async () => {
    setSignInLoading(true)
    // Simulate sign in process
    setTimeout(() => {
      setSignInLoading(false)
      setShowSignIn(false)
    }, 2000)
  }

  const handleViewReport = () => {
    setShowReport(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800 relative overflow-hidden">
      <div className="floating-blur w-64 h-64 top-10 left-10 opacity-30"></div>
      <div className="floating-blur w-96 h-96 top-1/2 right-10 opacity-20"></div>
      <div className="floating-blur w-48 h-48 bottom-20 left-1/3 opacity-25"></div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-green-200 dark:border-slate-700 animate-slide-up">
        <div className="mobile-container max-w-7xl mx-auto">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
                <Leaf className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">AgriSecure Hub</h1>
                <p className="text-xs text-slate-600 dark:text-slate-400">Drone-Powered Agriculture</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <ThemeToggle />
              <nav className="hidden md:flex items-center gap-6">
                <Link href="/agri" className="text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">
                  Dashboard
                </Link>
                <Button variant="outline" size="sm" onClick={() => setShowSignIn(true)}>
                  Sign In
                </Button>
              </nav>
              <Button variant="ghost" size="sm" className="md:hidden">
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 sm:py-20 mobile-container relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 animate-fade-in">
            <Badge variant="secondary" className="mb-4 animate-bounce-in">
              AI-Powered Drone Technology
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-slate-900 dark:text-slate-100 mb-6 animate-slide-up">
              Revolutionary Agriculture,
              <br />
              <span className="text-primary animate-glow">Powered by Autonomous Drones</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-8 animate-fade-in">
              Transform your farming with cutting-edge drone technology. Real-time crop monitoring, AI-powered disease
              detection, and comprehensive data analysis to maximize your harvest and protect your investment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
              <Link href="/agri">
                <Button size="lg" className="w-full sm:w-auto mobile-button button-hover">
                  <Plane className="w-5 h-5 mr-2" />
                  Launch Dashboard
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto mobile-button bg-transparent hover:bg-primary/10 dark:hover:bg-primary/20 border-2 border-primary/30 hover:border-primary/60 dark:border-primary/40 dark:hover:border-primary/80 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 dark:hover:shadow-primary/30 group button-hover"
                onClick={handleViewReport}
              >
                <FileText className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-200" />
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent group-hover:from-accent group-hover:to-primary transition-all duration-300">
                  View Report
                </span>
              </Button>
            </div>
          </div>

          {/* Main Feature Card */}
          <div className="max-w-4xl mx-auto animate-scale-in">
            <Card className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary/20 dark:bg-slate-800 dark:border-slate-700 card-hover">
              <CardHeader className="mobile-card pb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-lg group-hover:bg-primary/20 dark:group-hover:bg-primary/30 transition-colors">
                    <div className="relative">
                      <Leaf className="w-8 h-8 text-primary" />
                      <Plane className="w-4 h-4 text-primary absolute -top-1 -right-1" />
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-2xl sm:text-3xl dark:text-slate-100">
                      Complete Agricultural Intelligence
                    </CardTitle>
                    <CardDescription className="text-base sm:text-lg dark:text-slate-300">
                      Autonomous drone fleet with AI-powered crop analysis and real-time monitoring
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="mobile-card space-y-6 sm:space-y-8">
                <div className="aspect-video bg-gradient-to-br from-green-100 to-emerald-100 dark:from-slate-700 dark:to-slate-600 rounded-lg flex items-center justify-center">
                  <img
                    src="/placeholder-c44im.png"
                    alt="Drone crop monitoring technology"
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center gap-3">
                      <Plane className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                      <span className="mobile-text font-medium text-slate-700 dark:text-slate-300">
                        Autonomous Drone Fleet Management
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                      <span className="mobile-text font-medium text-slate-700 dark:text-slate-300">
                        AI-Powered Disease Detection
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Satellite className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                      <span className="mobile-text font-medium text-slate-700 dark:text-slate-300">
                        Real-time Environmental Monitoring
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                      <span className="mobile-text font-medium text-slate-700 dark:text-slate-300">
                        Advanced Analytics & Reporting
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                      <span className="mobile-text font-medium text-slate-700 dark:text-slate-300">
                        Predictive Crop Health Insights
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                      <span className="mobile-text font-medium text-slate-700 dark:text-slate-300">
                        Precision Field Mapping
                      </span>
                    </div>
                  </div>
                </div>

                <Link href="/agri" className="block">
                  <Button className="w-full mobile-button" size="lg">
                    <Plane className="w-5 h-5 mr-2" />
                    Start Drone Monitoring
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-20 bg-white dark:bg-slate-900 relative z-10">
        <div className="max-w-7xl mx-auto mobile-container">
          <div className="text-center mb-12 sm:mb-16 animate-fade-in">
            <h2 className="mobile-heading md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Why Choose Drone-Powered Agriculture?
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Revolutionize your farming with cutting-edge drone technology and AI-powered insights for maximum crop
              yield and protection
            </p>
          </div>

          <div className="mobile-grid">
            <div className="text-center animate-stagger-1 card-hover p-6 rounded-lg">
              <div className="flex items-center justify-center w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full mx-auto mb-4 animate-float">
                <Plane className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Autonomous Fleet Management
              </h3>
              <p className="mobile-text text-slate-600 dark:text-slate-300">
                Deploy multiple autonomous drones simultaneously for comprehensive field coverage and real-time data
                collection across your entire farm
              </p>
            </div>

            <div className="text-center animate-stagger-2 card-hover p-6 rounded-lg">
              <div className="flex items-center justify-center w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full mx-auto mb-4 animate-float">
                <Camera className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                AI Disease Detection
              </h3>
              <p className="mobile-text text-slate-600 dark:text-slate-300">
                Advanced computer vision and machine learning algorithms identify crop diseases early, enabling
                proactive treatment and prevention
              </p>
            </div>

            <div className="text-center animate-stagger-3 card-hover p-6 rounded-lg">
              <div className="flex items-center justify-center w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full mx-auto mb-4 animate-float">
                <BarChart3 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Comprehensive Analytics
              </h3>
              <p className="mobile-text text-slate-600 dark:text-slate-300">
                Generate detailed reports and insights from aerial data to optimize irrigation, fertilization, and
                harvest timing for maximum yield
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sign In Modal */}
      {showSignIn && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <Card className="w-full max-w-md transform animate-scale-in backdrop-blur-sm bg-white/95 dark:bg-slate-900/95 border border-white/20 dark:border-slate-700/50 shadow-2xl">
            <CardHeader>
              <CardTitle>Sign In to AgriSecure Hub</CardTitle>
              <CardDescription>Access your drone management dashboard</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border rounded-md dark:bg-slate-800 dark:border-slate-600"
                  placeholder="farmer@example.com"
                  value={signInData.email}
                  onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border rounded-md dark:bg-slate-800 dark:border-slate-600"
                  placeholder="••••••••"
                  value={signInData.password}
                  onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleSignIn} disabled={signInLoading}>
                  {signInLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Sign In
                </Button>
                <Button variant="outline" onClick={() => setShowSignIn(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto transform animate-scale-in backdrop-blur-sm bg-white/95 dark:bg-slate-900/95 border border-white/20 dark:border-slate-700/50 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Sample Crop Health Report
              </CardTitle>
              <CardDescription>Comprehensive analysis from drone monitoring and AI detection systems</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Report Summary */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">92%</div>
                  <div className="text-sm text-green-700 dark:text-green-300">Overall Health</div>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">15.2 ha</div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">Area Surveyed</div>
                </div>
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">3</div>
                  <div className="text-sm text-orange-700 dark:text-orange-300">Issues Detected</div>
                </div>
              </div>

              {/* Detailed Analysis */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Detailed Analysis</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Crop Density</span>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                    >
                      Excellent
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span>Irrigation Status</span>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                    >
                      Needs Attention
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span>Disease Detection</span>
                    </div>
                    <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                      Early Stage Rust
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Recommendations</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-100">Increase irrigation in Zone 3</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Soil moisture levels are below optimal range
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-medium text-orange-900 dark:text-orange-100">Apply fungicide treatment</p>
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        Early stage rust detected in northwest section
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-medium text-green-900 dark:text-green-100">
                        Continue current fertilization schedule
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Nutrient levels are optimal across most areas
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Link href="/agri">
                  <Button className="flex-1">
                    <Plane className="w-4 h-4 mr-2" />
                    View Full Dashboard
                  </Button>
                </Link>
                <Button variant="outline" onClick={() => setShowReport(false)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-slate-950 text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto mobile-container">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
                <Leaf className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">AgriSecure Hub</span>
            </div>
            <p className="text-slate-400 text-sm sm:text-base text-center sm:text-right">
              © 2024 AgriSecure Hub. Revolutionizing agriculture with drone technology.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

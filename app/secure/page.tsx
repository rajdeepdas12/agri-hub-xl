import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import {
  Shield,
  Camera,
  Lock,
  Unlock,
  Monitor,
  ArrowLeft,
  Settings,
  Bell,
  Eye,
  DoorOpen,
  Battery,
  Activity,
  Users,
  Phone,
  Plane,
  Radar,
  MapPin,
  Zap,
} from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"

export default function SecureDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-blue-200 dark:border-slate-700">
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
                    <Shield className="w-5 h-5 text-primary-foreground" />
                    <Plane className="w-2 h-2 text-primary-foreground absolute -top-0.5 -right-0.5" />
                  </div>
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">Secure-Module</h1>
                  <p className="text-xs text-slate-600 dark:text-slate-400 hidden sm:block">
                    Aerial Security Management
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle />
              <Button variant="outline" size="sm" className="hidden sm:flex bg-transparent">
                <Plane className="w-4 h-4 mr-2" />
                Launch Patrol
              </Button>
              <Button size="sm" className="mobile-button">
                <Radar className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Perimeter Scan</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto mobile-container py-4 sm:py-8">
        {/* System Status Cards */}
        <div className="mobile-grid lg:grid-cols-4 mb-6 sm:mb-8">
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-slate-100">System Status</CardTitle>
              <Shield className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Armed</div>
              <p className="text-xs text-muted-foreground dark:text-slate-400">All zones active</p>
            </CardContent>
          </Card>

          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-slate-100">Active Cameras</CardTitle>
              <Camera className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-slate-100">8/8</div>
              <p className="text-xs text-muted-foreground dark:text-slate-400">All online</p>
            </CardContent>
          </Card>

          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-slate-100">Access Points</CardTitle>
              <Lock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">Secured</div>
              <p className="text-xs text-muted-foreground dark:text-slate-400">6 doors, 4 windows</p>
            </CardContent>
          </Card>

          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-slate-100">Drone Patrols</CardTitle>
              <Plane className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-slate-100">2/3</div>
              <p className="text-xs text-muted-foreground dark:text-slate-400">Active patrols</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Left Column - Security Controls */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="monitoring" className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 dark:bg-slate-800">
                <TabsTrigger value="monitoring" className="text-xs sm:text-sm">
                  Monitoring
                </TabsTrigger>
                <TabsTrigger value="aerial" className="text-xs sm:text-sm">
                  Aerial
                </TabsTrigger>
                <TabsTrigger value="access" className="text-xs sm:text-sm hidden sm:block">
                  Access
                </TabsTrigger>
                <TabsTrigger value="alerts" className="text-xs sm:text-sm">
                  Alerts
                </TabsTrigger>
              </TabsList>

              <TabsContent value="monitoring" className="space-y-6">
                <Card className="dark:bg-slate-800 dark:border-slate-700">
                  <CardHeader className="mobile-card">
                    <CardTitle className="flex items-center gap-2 dark:text-slate-100">
                      <Monitor className="w-5 h-5" />
                      Camera Feeds
                    </CardTitle>
                    <CardDescription className="dark:text-slate-300">
                      Real-time surveillance from all security cameras
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="mobile-card">
                    <div className="mobile-grid">
                      {[
                        { name: "Front Door", status: "Active", location: "Main Entrance" },
                        { name: "Backyard", status: "Active", location: "Garden Area" },
                        { name: "Garage", status: "Active", location: "Vehicle Access" },
                        { name: "Living Room", status: "Active", location: "Interior" },
                      ].map((camera, index) => (
                        <div key={index} className="relative">
                          <div className="aspect-video bg-slate-900 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                            <img
                              src={`/placeholder_image.png?height=200&width=300&text=${camera.name} Camera Feed`}
                              alt={`${camera.name} camera feed`}
                              className="w-full h-full object-cover rounded-lg"
                            />
                            <div className="absolute top-2 left-2">
                              <Badge
                                variant="secondary"
                                className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                              >
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                                Live
                              </Badge>
                            </div>
                            <div className="absolute bottom-2 left-2 right-2">
                              <div className="bg-black/70 text-white text-sm p-2 rounded">
                                <p className="font-medium">{camera.name}</p>
                                <p className="text-xs opacity-75">{camera.location}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-2 gap-2">
                            <Button variant="outline" size="sm" className="bg-transparent flex-1 mobile-button">
                              <Eye className="w-4 h-4 sm:mr-1" />
                              <span className="hidden sm:inline">View</span>
                            </Button>
                            <Button variant="outline" size="sm" className="bg-transparent flex-1 mobile-button">
                              <Settings className="w-4 h-4 sm:mr-1" />
                              <span className="hidden sm:inline">Settings</span>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Motion Detection */}
                <Card className="dark:bg-slate-800 dark:border-slate-700">
                  <CardHeader className="mobile-card">
                    <CardTitle className="dark:text-slate-100">Motion Detection Zones</CardTitle>
                    <CardDescription className="dark:text-slate-300">
                      Configure and monitor motion-sensitive areas
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="mobile-card space-y-4">
                    {[
                      { zone: "Front Entrance", status: "Active", sensitivity: "High", lastTrigger: "2 hours ago" },
                      { zone: "Driveway", status: "Active", sensitivity: "Medium", lastTrigger: "5 hours ago" },
                      { zone: "Backyard", status: "Paused", sensitivity: "Low", lastTrigger: "1 day ago" },
                      { zone: "Side Gate", status: "Active", sensitivity: "High", lastTrigger: "3 hours ago" },
                    ].map((zone, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border rounded-lg dark:border-slate-600 dark:bg-slate-700"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className={`w-3 h-3 rounded-full flex-shrink-0 ${
                              zone.status === "Active" ? "bg-green-500" : "bg-yellow-500"
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium dark:text-slate-100 truncate">{zone.zone}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300 truncate">
                              {zone.sensitivity} sensitivity • Last: {zone.lastTrigger}
                            </p>
                          </div>
                        </div>
                        <Switch checked={zone.status === "Active"} className="flex-shrink-0" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="aerial" className="space-y-6">
                <Card className="dark:bg-slate-800 dark:border-slate-700">
                  <CardHeader className="mobile-card">
                    <CardTitle className="flex items-center gap-2 dark:text-slate-100">
                      <Plane className="w-5 h-5" />
                      Drone Security Fleet
                    </CardTitle>
                    <CardDescription className="dark:text-slate-300">
                      Autonomous aerial surveillance and perimeter monitoring
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="mobile-card space-y-6">
                    {/* Drone Fleet Status */}
                    <div className="mobile-grid">
                      {[
                        { id: "SEC-01", status: "Patrolling", battery: 78, zone: "North Perimeter", altitude: "50m" },
                        { id: "SEC-02", status: "Patrolling", battery: 65, zone: "East Boundary", altitude: "45m" },
                        { id: "SEC-03", status: "Charging", battery: 100, zone: "Base Station", altitude: "0m" },
                      ].map((drone, index) => (
                        <div
                          key={index}
                          className="p-4 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Plane className="w-4 h-4 text-primary" />
                              <span className="font-medium dark:text-slate-100">{drone.id}</span>
                            </div>
                            <Badge
                              variant="secondary"
                              className={
                                drone.status === "Patrolling"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                  : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                              }
                            >
                              {drone.status}
                            </Badge>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-600 dark:text-slate-400">Battery:</span>
                              <span className="font-medium dark:text-slate-100">{drone.battery}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600 dark:text-slate-400">Zone:</span>
                              <span className="font-medium dark:text-slate-100 truncate ml-2">{drone.zone}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600 dark:text-slate-400">Altitude:</span>
                              <span className="font-medium dark:text-slate-100">{drone.altitude}</span>
                            </div>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1 bg-transparent mobile-button">
                              <Eye className="w-3 h-3 sm:mr-1" />
                              <span className="hidden sm:inline">Live Feed</span>
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1 bg-transparent mobile-button">
                              <MapPin className="w-3 h-3 sm:mr-1" />
                              <span className="hidden sm:inline">Track</span>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Patrol Control */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Button className="h-12 sm:h-16 flex-col gap-2 mobile-button">
                        <Radar className="w-5 h-5 sm:w-6 sm:h-6" />
                        <span className="text-xs sm:text-sm">Start Perimeter Sweep</span>
                      </Button>
                      <Button variant="outline" className="h-12 sm:h-16 flex-col gap-2 bg-transparent mobile-button">
                        <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
                        <span className="text-xs sm:text-sm">Emergency Response</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Threat Detection */}
                <Card className="dark:bg-slate-800 dark:border-slate-700">
                  <CardHeader className="mobile-card">
                    <CardTitle className="dark:text-slate-100">AI Threat Detection</CardTitle>
                    <CardDescription className="dark:text-slate-300">
                      Real-time analysis of aerial surveillance data
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="mobile-card space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                      <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 mx-auto mb-2" />
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Perimeter Status</p>
                        <p className="text-sm sm:text-lg font-bold text-green-600">Secure</p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mx-auto mb-2" />
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Active Cameras</p>
                        <p className="text-sm sm:text-lg font-bold text-blue-600">12</p>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 mx-auto mb-2" />
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Alerts Today</p>
                        <p className="text-sm sm:text-lg font-bold text-yellow-600">3</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 mx-auto mb-2" />
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Flight Hours</p>
                        <p className="text-sm sm:text-lg font-bold text-purple-600">47.2</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="access" className="space-y-6">
                <Card className="dark:bg-slate-800 dark:border-slate-700">
                  <CardHeader className="mobile-card">
                    <CardTitle className="flex items-center gap-2 dark:text-slate-100">
                      <Lock className="w-5 h-5" />
                      Door & Window Status
                    </CardTitle>
                    <CardDescription className="dark:text-slate-300">
                      Monitor and control all access points
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="mobile-card space-y-4">
                    {[
                      { name: "Front Door", type: "Smart Lock", status: "Locked", battery: 85 },
                      { name: "Back Door", type: "Smart Lock", status: "Locked", battery: 92 },
                      { name: "Garage Door", type: "Automatic", status: "Closed", battery: null },
                      { name: "Living Room Window", type: "Sensor", status: "Closed", battery: 78 },
                      { name: "Kitchen Window", type: "Sensor", status: "Open", battery: 65 },
                      { name: "Bedroom Window", type: "Sensor", status: "Closed", battery: 88 },
                    ].map((access, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border rounded-lg dark:border-slate-600 dark:bg-slate-700 gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="flex items-center justify-center w-10 h-10 bg-slate-100 dark:bg-slate-600 rounded-lg flex-shrink-0">
                            {access.status === "Locked" || access.status === "Closed" ? (
                              <Lock className="w-5 h-5 text-green-600" />
                            ) : access.status === "Open" ? (
                              <DoorOpen className="w-5 h-5 text-yellow-600" />
                            ) : (
                              <Unlock className="w-5 h-5 text-red-600" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium dark:text-slate-100 truncate">{access.name}</p>
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                              <span className="truncate">{access.type}</span>
                              {access.battery && (
                                <>
                                  <span>•</span>
                                  <Battery className="w-3 h-3 flex-shrink-0" />
                                  <span>{access.battery}%</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge
                            variant="secondary"
                            className={
                              access.status === "Locked" || access.status === "Closed"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                : access.status === "Open"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                            }
                          >
                            {access.status}
                          </Badge>
                          {access.name.includes("Door") && (
                            <Button variant="outline" size="sm" className="bg-transparent mobile-button hidden sm:flex">
                              {access.status === "Locked" ? "Unlock" : "Lock"}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* User Access Management */}
                <Card className="dark:bg-slate-800 dark:border-slate-700">
                  <CardHeader className="mobile-card">
                    <CardTitle className="dark:text-slate-100">User Access Management</CardTitle>
                    <CardDescription className="dark:text-slate-300">
                      Manage family members and guest access
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="mobile-card space-y-4">
                    {[
                      { name: "John Smith", role: "Owner", lastAccess: "Currently home", status: "Active" },
                      { name: "Sarah Smith", role: "Family", lastAccess: "2 hours ago", status: "Active" },
                      { name: "Mike Johnson", role: "Guest", lastAccess: "Yesterday", status: "Temporary" },
                      { name: "Cleaning Service", role: "Service", lastAccess: "3 days ago", status: "Scheduled" },
                    ].map((user, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border rounded-lg dark:border-slate-600 dark:bg-slate-700"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="flex items-center justify-center w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-full flex-shrink-0">
                            <Users className="w-5 h-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium dark:text-slate-100 truncate">{user.name}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300 truncate">
                              {user.role} • {user.lastAccess}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className={
                            user.status === "Active"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                              : user.status === "Temporary"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                          }
                        >
                          {user.status}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="alerts" className="space-y-6">
                <Card className="dark:bg-slate-800 dark:border-slate-700">
                  <CardHeader className="mobile-card">
                    <CardTitle className="dark:text-slate-100">Recent Security Alerts</CardTitle>
                    <CardDescription className="dark:text-slate-300">
                      Complete history of security events and notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="mobile-card">
                    <div className="space-y-4">
                      {[
                        {
                          type: "Motion",
                          message: "Motion detected at Front Entrance",
                          time: "2 hours ago",
                          severity: "low",
                          resolved: true,
                        },
                        {
                          type: "Access",
                          message: "Front door unlocked by Sarah Smith",
                          time: "3 hours ago",
                          severity: "info",
                          resolved: true,
                        },
                        {
                          type: "System",
                          message: "Kitchen window sensor battery low",
                          time: "5 hours ago",
                          severity: "medium",
                          resolved: false,
                        },
                        {
                          type: "Motion",
                          message: "Unusual activity detected in backyard",
                          time: "1 day ago",
                          severity: "high",
                          resolved: true,
                        },
                        {
                          type: "Access",
                          message: "Failed access attempt at back door",
                          time: "2 days ago",
                          severity: "high",
                          resolved: true,
                        },
                      ].map((alert, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 border rounded-lg dark:border-slate-600 dark:bg-slate-700 gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              className={`w-3 h-3 rounded-full flex-shrink-0 ${
                                alert.severity === "high"
                                  ? "bg-red-500"
                                  : alert.severity === "medium"
                                    ? "bg-yellow-500"
                                    : alert.severity === "low"
                                      ? "bg-orange-500"
                                      : "bg-blue-500"
                              }`}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium dark:text-slate-100 truncate">{alert.message}</p>
                              <p className="text-sm text-slate-600 dark:text-slate-300 truncate">
                                {alert.type} Alert • {alert.time}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {alert.resolved ? (
                              <Badge
                                variant="secondary"
                                className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                              >
                                Resolved
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                              >
                                Pending
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - System Info & Quick Actions */}
          <div className="space-y-6">
            {/* System Health */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardHeader className="mobile-card">
                <CardTitle className="flex items-center gap-2 dark:text-slate-100">
                  <Activity className="w-5 h-5" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent className="mobile-card space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="dark:text-slate-300">Network Connectivity</span>
                      <span className="text-green-600">Excellent</span>
                    </div>
                    <Progress value={95} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="dark:text-slate-300">Camera Performance</span>
                      <span className="text-green-600">Good</span>
                    </div>
                    <Progress value={88} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="dark:text-slate-300">Sensor Battery Avg</span>
                      <span className="text-yellow-600">Fair</span>
                    </div>
                    <Progress value={72} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="dark:text-slate-300">Storage Available</span>
                      <span className="text-green-600">Good</span>
                    </div>
                    <Progress value={65} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contacts */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardHeader className="mobile-card">
                <CardTitle className="dark:text-slate-100">Emergency Contacts</CardTitle>
                <CardDescription className="dark:text-slate-300">Quick access to emergency services</CardDescription>
              </CardHeader>
              <CardContent className="mobile-card space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 mobile-button"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Emergency Services (911)
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent mobile-button">
                  <Phone className="w-4 h-4 mr-2" />
                  Security Company
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent mobile-button">
                  <Phone className="w-4 h-4 mr-2" />
                  Neighbor Contact
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardHeader className="mobile-card">
                <CardTitle className="dark:text-slate-100">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="mobile-card space-y-3">
                <Button variant="outline" className="w-full justify-start bg-transparent mobile-button">
                  <Plane className="w-4 h-4 mr-2" />
                  Launch Security Patrol
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent mobile-button">
                  <Radar className="w-4 h-4 mr-2" />
                  Emergency Perimeter Scan
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent mobile-button">
                  <Shield className="w-4 h-4 mr-2" />
                  Arm/Disarm System
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent mobile-button">
                  <Camera className="w-4 h-4 mr-2" />
                  View All Feeds
                </Button>
              </CardContent>
            </Card>

            {/* Current Status */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardHeader className="mobile-card">
                <CardTitle className="dark:text-slate-100">Current Status</CardTitle>
              </CardHeader>
              <CardContent className="mobile-card space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm dark:text-slate-300">Security System</span>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Armed</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm dark:text-slate-300">All Doors</span>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Locked</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm dark:text-slate-300">Motion Detection</span>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm dark:text-slate-300">Camera Recording</span>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">On</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

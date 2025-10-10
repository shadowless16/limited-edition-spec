"use client"

import { useState, useEffect } from "react"
import Header from "@/components/layout/Header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package, Clock, CheckCircle, AlertCircle } from "lucide-react"

interface WaitlistEntry {
  _id: string
  productId: {
    _id: string
    name: string
    images: string[]
    currentPhase: string
  }
  position: number
  status: string
  createdAt: string
}

interface User {
  id: string
  name: string
  email: string
  ownerTag?: string
  role: string
}

interface Order {
  _id: string
  items: Array<{
    productId: {
      name: string
      images: string[]
    }
    quantity: number
    unitPrice: number
  }>
  total: number
  status: string
  paymentStatus: string
  createdAt: string
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        window.location.href = "/"
        return
      }

      const [userRes, waitlistRes, ordersRes] = await Promise.all([
        fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/user/waitlist", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/orders", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (userRes.ok) {
        const userData = await userRes.json()
        setUser(userData)
      }

      if (waitlistRes.ok) {
        const waitlistData = await waitlistRes.json()
        setWaitlistEntries(Array.isArray(waitlistData) ? waitlistData : [])
      }

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json()
        setOrders(Array.isArray(ordersData) ? ordersData : [])
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "cancelled":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Package className="h-4 w-4 text-gray-500" />
    }
  }

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case "waitlist":
        return "bg-blue-500"
      case "originals":
        return "bg-emerald-500"
      case "echo":
        return "bg-amber-500"
      default:
        return "bg-gray-500"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-4xl mx-auto space-y-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Dashboard</h1>
            {user?.ownerTag && (
              <p className="text-muted-foreground mt-1">Owner Tag: <span className="font-mono font-semibold">{user.ownerTag}</span></p>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Waitlist Entries</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{waitlistEntries.length}</div>
              <p className="text-xs text-muted-foreground">Active waitlists</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{(orders.reduce((sum, order) => sum + (order.total || 0), 0) / 100).toFixed(0)}</div>
              <p className="text-xs text-muted-foreground">Lifetime value</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="waitlist" className="space-y-4">
          <TabsList>
            <TabsTrigger value="waitlist">Waitlist</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="waitlist" className="space-y-4">
            {waitlistEntries.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Waitlist Entries</h3>
                    <p className="text-muted-foreground mb-4">
                      Join a waitlist to be notified when products become available.
                    </p>
                    <Button asChild>
                      <a href="/drops">Browse Products</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {waitlistEntries.map((entry) => (
                  <Card key={entry._id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                            <Package className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{entry.productId.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              Position #{entry.position} • Joined {new Date(entry.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getPhaseColor(entry.productId.currentPhase)}>
                            {entry.productId.currentPhase}
                          </Badge>
                          <Badge variant={entry.status === "active" ? "default" : "secondary"}>{entry.status}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            {orders.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Orders Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Your order history will appear here once you make a purchase.
                    </p>
                    <Button asChild>
                      <a href="/drops">Shop Now</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {orders.map((order) => (
                  <Card key={order._id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold">Order #{order._id.slice(-8)}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(order.status)}
                          <Badge variant={order.status === "completed" ? "default" : "secondary"}>{order.status}</Badge>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span>
                              {item.productId?.name || 'Product'} × {item.quantity}
                            </span>
                            <span>₦{((item.unitPrice || 0) * item.quantity / 100).toFixed(0)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="border-t pt-2 mt-2">
                        <div className="flex items-center justify-between font-semibold">
                          <span>Total</span>
                          <span>₦{((order.total || 0) / 100).toFixed(0)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

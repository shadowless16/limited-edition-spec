"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package, Users, ShoppingCart, TrendingUp, Edit, Trash2 } from "lucide-react"
import OrderManagement from "@/components/OrderManagement"
import { formatPrice } from "@/lib/pricing"
import CreateProductModal from "@/components/admin/CreateProductModal"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { X } from "lucide-react"

interface Product {
  _id: string
  name: string
  currentPhase: "waitlist" | "originals" | "echo"
  status: "active" | "paused" | "ended"
  variants: Array<{
    color: string
    material: string
    stock: number
    reserved: number
  }>
  waitlistCount: number
  totalSold: number
  basePrice: number
  images: string[]
  sku: string // Add the 'sku' property
}

interface WaitlistEntry {
  _id: string
  productId: string
  email: string
  position: number
  status: "active" | "notified" | "converted"
  createdAt: string
}

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([])
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [productsRes, waitlistRes] = await Promise.all([fetch("/api/admin/products"), fetch("/api/admin/waitlist")])

      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setProducts(productsData.map((product: any) => ({
          ...product,
          sku: product.sku || "", // Ensure 'sku' is included
        })))
      }

      if (waitlistRes.ok) {
        const waitlistData = await waitlistRes.json()
        setWaitlistEntries(waitlistData)
      }
    } catch (error) {
      console.error("Error fetching admin data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateProductPhase = async (productId: string, newPhase: string) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}/phase`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase: newPhase }),
      })

      if (response.ok) {
        fetchData() // Refresh data
      }
    } catch (error) {
      console.error("Error updating product phase:", error)
    }
  }

  const deleteProduct = async (productId: string) => {
    // kept for backward compatibility; callers now use ConfirmDelete below
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchData() // Refresh data
      }
    } catch (error) {
      console.error("Error deleting product:", error)
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
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const totalProducts = products.length
  const totalWaitlist = waitlistEntries.length
  const totalSales = products.reduce((sum, p) => sum + p.totalSold, 0)
  const activeProducts = products.filter((p) => p.status === "active").length

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <CreateProductModal onProductCreated={fetchData} />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}</div>
              <p className="text-xs text-muted-foreground">{activeProducts} active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Waitlist Entries</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalWaitlist}</div>
              <p className="text-xs text-muted-foreground">Across all products</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSales}</div>
              <p className="text-xs text-muted-foreground">Units sold</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalWaitlist > 0 ? Math.round((totalSales / totalWaitlist) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Waitlist to sale</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="products" className="space-y-4">
          <TabsList>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="waitlist">Waitlist</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            <div className="grid gap-4">
              {products.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Package className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No products yet</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      Create your first limited edition product to get started.
                    </p>
                    <CreateProductModal onProductCreated={fetchData} />
                  </CardContent>
                </Card>
              ) : (
                products.map((product) => (
                  <Card key={product._id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {product.images && product.images.length > 0 && (
                            <img
                              src={product.images[0] || "/placeholder.svg"}
                              alt={product.name}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          )}
                          <div>
                            <CardTitle className="text-lg">{product.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">{formatPrice(product.basePrice)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getPhaseColor(product.currentPhase)}>{product.currentPhase}</Badge>
                          <Badge variant={product.status === "active" ? "default" : "secondary"}>
                            {product.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Waitlist</p>
                          <p className="text-2xl font-bold">{product.waitlistCount || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Sold</p>
                          <p className="text-2xl font-bold">{product.totalSold || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Variants</p>
                          <p className="text-2xl font-bold">{product.variants?.length || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Stock</p>
                          <p className="text-2xl font-bold">
                            {product.variants?.reduce((sum, v) => sum + v.stock, 0) || 0}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {product.currentPhase === "waitlist" && (
                          <Button size="sm" onClick={() => updateProductPhase(product._id, "originals")}>
                            Launch Originals
                          </Button>
                        )}
                        {product.currentPhase === "originals" && (
                          <Button size="sm" onClick={() => updateProductPhase(product._id, "echo")}>
                            Open Echo Phase
                          </Button>
                        )}
                        <CreateProductModal
                          product={product}
                          onProductUpdated={() => fetchData()}
                        >
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Product
                          </Button>
                        </CreateProductModal>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Confirm Delete</DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                              <p>Are you sure you want to delete the product "{product.name}"? This action cannot be undone.</p>
                              <div className="flex justify-end gap-2 mt-4">
                                <DialogClose asChild>
                                  <Button variant="outline">Cancel</Button>
                                </DialogClose>
                                <DialogClose asChild>
                                  <Button
                                    className="text-destructive"
                                    onClick={async () => {
                                      await deleteProduct(product._id)
                                    }}
                                  >
                                    Delete
                                  </Button>
                                </DialogClose>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="waitlist" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Waitlist Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {waitlistEntries.slice(0, 10).map((entry) => (
                    <div key={entry._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{entry.email}</p>
                        <p className="text-sm text-muted-foreground">
                          Position #{entry.position} • {new Date(entry.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={entry.status === "active" ? "default" : "secondary"}>{entry.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <OrderManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

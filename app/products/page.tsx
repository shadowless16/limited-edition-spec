"use client"

import { useState, useEffect } from "react"
import Header from "@/components/layout/Header"
import ProductCard from "@/components/product/ProductCard"
import { Button } from "@/components/ui/button"
import { Filter, Search, SlidersHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface Product {
  _id: string
  name: string
  sku: string
  basePrice: number
  images: string[]
  currentPhase: "waitlist" | "originals" | "echo"
  status: "active" | "paused" | "ended"
  variants: Array<{
    color: string
    material: string
    stock: number
    reserved: number
  }>
  waitlistCount?: number
  totalSold?: number
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPhase, setSelectedPhase] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("newest")
  const [priceRange, setPriceRange] = useState<string>("all")

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    filterAndSortProducts()
  }, [products, searchQuery, selectedPhase, sortBy, priceRange])

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products")
      if (response.ok) {
  const data = await response.json()
  // API returns { products: Product[] } but other callers may return an array directly.
  // Normalize to an array to avoid runtime errors like "products.filter is not a function".
  const productsArray = Array.isArray(data) ? data : data?.products ?? []
  setProducts(productsArray)
      }
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterAndSortProducts = () => {
    let filtered = [...products]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.sku.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Phase filter
    if (selectedPhase !== "all") {
      filtered = filtered.filter((product) => product.currentPhase === selectedPhase)
    }

    // Price range filter
    if (priceRange !== "all") {
      const [min, max] = priceRange.split("-").map(Number)
      filtered = filtered.filter((product) => {
        const price = product.basePrice / 100
        if (max) {
          return price >= min && price <= max
        }
        return price >= min
      })
    }

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.basePrice - b.basePrice
        case "price-high":
          return b.basePrice - a.basePrice
        case "name":
          return a.name.localeCompare(b.name)
        case "popular":
          return (b.waitlistCount || 0) - (a.waitlistCount || 0)
        default: // newest
          return b._id.localeCompare(a._id)
      }
    })

    setFilteredProducts(filtered)
  }

  const getPhaseStats = () => {
    const stats = {
      all: products.length,
      waitlist: products.filter((p) => p.currentPhase === "waitlist").length,
      originals: products.filter((p) => p.currentPhase === "originals").length,
      echo: products.filter((p) => p.currentPhase === "echo").length,
    }
    return stats
  }

  const phaseStats = getPhaseStats()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <div className="space-y-4 mb-8">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex gap-4 mb-8">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-24" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-48 w-full mb-4" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">All Products</h1>
          <p className="text-muted-foreground">
            Discover our exclusive limited-edition drops • {products.length} products available
          </p>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Price" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="0-50">Under ₦50</SelectItem>
                <SelectItem value="50-200">₦50 - ₦200</SelectItem>
                <SelectItem value="200-500">₦200 - ₦500</SelectItem>
                <SelectItem value="500">₦500+</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="bg-transparent">
              <Filter className="mr-2 h-4 w-4" />
              More Filters
            </Button>
          </div>
        </div>

        {/* Phase Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          <Button
            variant={selectedPhase === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedPhase("all")}
            className="whitespace-nowrap"
          >
            All ({phaseStats.all})
          </Button>
          <Button
            variant={selectedPhase === "waitlist" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedPhase("waitlist")}
            className="whitespace-nowrap"
          >
            Waitlist ({phaseStats.waitlist})
          </Button>
          <Button
            variant={selectedPhase === "originals" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedPhase("originals")}
            className="whitespace-nowrap"
          >
            Originals ({phaseStats.originals})
          </Button>
          <Button
            variant={selectedPhase === "echo" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedPhase("echo")}
            className="whitespace-nowrap"
          >
            Echo ({phaseStats.echo})
          </Button>
        </div>

        {/* Results Summary */}
        {(searchQuery || selectedPhase !== "all" || priceRange !== "all") && (
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm text-muted-foreground">
              Showing {filteredProducts.length} of {products.length} products
            </span>
            {searchQuery && (
              <Badge variant="secondary" className="gap-1">
                Search: "{searchQuery}"
                <button
                  onClick={() => setSearchQuery("")}
                  className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                >
                  ×
                </button>
              </Badge>
            )}
            {selectedPhase !== "all" && (
              <Badge variant="secondary" className="gap-1">
                Phase: {selectedPhase}
                <button
                  onClick={() => setSelectedPhase("all")}
                  className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                >
                  ×
                </button>
              </Badge>
            )}
            {priceRange !== "all" && (
                <Badge variant="secondary" className="gap-1">
                Price: {priceRange === "500" ? "₦500+" : `₦${priceRange.replace("-", " - ₦")}`}
                <button
                  onClick={() => setPriceRange("all")}
                  className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                >
                  ×
                </button>
              </Badge>
            )}
          </div>
        )}

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground text-center mb-4">
                Try adjusting your search or filter criteria to find what you're looking for.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("")
                  setSelectedPhase("all")
                  setPriceRange("all")
                }}
              >
                Clear All Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={{
                  id: product._id,
                  name: product.name,
                  sku: product.sku,
                  basePrice: product.basePrice,
                  images: product.images,
                  status: product.currentPhase,
                  variants: product.variants,
                }}
                waitlistPosition={product.currentPhase === "waitlist" ? Math.floor(Math.random() * 100) + 1 : undefined}
              />
            ))}
          </div>
        )}

        {/* Load More Button (for pagination) */}
        {filteredProducts.length > 0 && filteredProducts.length >= 12 && (
          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              Load More Products
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

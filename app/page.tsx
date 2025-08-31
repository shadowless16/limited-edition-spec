"use client"

import { useState, useEffect } from "react"
import Header from "@/components/layout/Header"
import ProductCard from "@/components/product/ProductCard"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"

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
  }>
  launchDate?: string
}

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedProducts()
  }, [])

  const fetchFeaturedProducts = async () => {
    try {
      const response = await fetch("/api/products?featured=true&limit=3")
      if (response.ok) {
        const data = await response.json()
        // API returns { products: Product[] } — normalize to an array to avoid runtime errors
        const products = Array.isArray(data) ? data : data?.products ?? []
        setFeaturedProducts(Array.isArray(products) ? products : [])
      }
    } catch (error) {
      console.error("Error fetching featured products:", error)
      setFeaturedProducts([
        {
          _id: "1",
          name: "Artisan Leather Bag",
          sku: "AB-B1-BG1",
          basePrice: 29900,
          images: ["/premium-leather-bag.png"],
          currentPhase: "originals" as const,
          status: "active" as const,
          variants: [
            { color: "black", material: "leather", stock: 8 },
            { color: "brown", material: "leather", stock: 5 },
            { color: "white", material: "canvas", stock: 12 },
          ],
        },
        {
          _id: "2",
          name: "Minimalist Watch",
          sku: "MW-S2-SL1",
          basePrice: 45900,
          images: ["/minimalist-luxury-watch.png"],
          currentPhase: "waitlist" as const,
          status: "active" as const,
          variants: [
            { color: "silver", material: "steel", stock: 25 },
            { color: "black", material: "steel", stock: 20 },
          ],
        },
        {
          _id: "3",
          name: "Ceramic Vase Set",
          sku: "CV-A3-WH1",
          basePrice: 18900,
          images: ["/modern-ceramic-vase-set.png"],
          currentPhase: "echo" as const,
          status: "active" as const,
          variants: [
            { color: "white", material: "ceramic", stock: 3 },
            { color: "black", material: "ceramic", stock: 1 },
          ],
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center bg-gradient-to-b from-background to-muted/20">
        <div className="container max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            Limited Edition Drops
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-balance leading-tight">
            Exclusive Products,
            <br />
            <span className="text-primary">Limited Quantities</span>
          </h1>

          <p className="text-lg text-muted-foreground text-pretty max-w-2xl mx-auto">
            Join our exclusive drops for handcrafted, limited-edition products. From waitlist to originals to echo
            phases - secure your piece of exclusivity.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button size="lg" className="min-w-[200px]" asChild>
              <Link href="/products">
                View Current Drops
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="min-w-[200px] bg-transparent" asChild>
              <Link href="/how-it-works">How It Works</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Current Drops</h2>
            <p className="text-muted-foreground text-lg">Limited quantities, premium quality, exclusive access</p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-muted rounded-lg mb-4"></div>
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.map((product) => (
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
                    launchDate: product.launchDate,
                  }}
                  waitlistPosition={product.currentPhase === "waitlist" ? 47 : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">How Limited Drops Work</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold text-lg mx-auto">
                1
              </div>
              <h3 className="text-xl font-semibold">Waitlist Phase</h3>
              <p className="text-muted-foreground">
                Join the waitlist early to secure your spot. Get notified when the originals phase begins.
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg mx-auto">
                2
              </div>
              <h3 className="text-xl font-semibold">Originals Phase</h3>
              <p className="text-muted-foreground">
                Limited quantities available with early bird pricing. First come, first served basis.
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-lg mx-auto">
                3
              </div>
              <h3 className="text-xl font-semibold">Echo Phase</h3>
              <p className="text-muted-foreground">
                Missed out? Request specific variants in the echo phase with escrow protection.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

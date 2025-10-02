"use client"

import { useState, useEffect } from "react"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import ProductCard from "@/components/product/ProductCard"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Sparkles, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

interface Product {
  _id: string
  name: string
  sku: string
  basePrice: number
  images: string[]
  status: "waitlist" | "originals" | "echo" | "active" | "paused" | "ended"
  variants: Array<{
    color: string
    material: string
    stock: number
  }>
  launchDate?: string
}

function HeroImageCarousel() {
  const [heroImages, setHeroImages] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    ;(async () => {
      try {
        const resp = await fetch('/api/settings/public')
        if (resp.ok) {
          const data = await resp.json()
          if (data.heroImages && Array.isArray(data.heroImages)) {
            setHeroImages(data.heroImages.filter(Boolean))
          }
        }
      } catch (e) {
        console.error('Failed to load hero images:', e)
      }
    })()
  }, [])

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.max(heroImages.length, 1))
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + Math.max(heroImages.length, 1)) % Math.max(heroImages.length, 1))
  }

  return (
    <div className="relative h-[400px] sm:h-[500px] lg:h-[600px] xl:h-[700px] order-1 lg:order-2">
      <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent rounded-2xl overflow-hidden">
        {heroImages.length > 0 ? (
          <img 
            src={heroImages[currentIndex]} 
            alt="Hero Product" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/20 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <div className="w-24 h-24 lg:w-32 lg:h-32 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                <Sparkles className="w-12 h-12 lg:w-16 lg:h-16" />
              </div>
              <p className="text-base lg:text-lg">Hero Product Image</p>
            </div>
          </div>
        )}
      </div>
      
      {heroImages.length > 1 && (
        <>
          <button 
            onClick={prevImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 lg:w-12 lg:h-12 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-background transition-colors"
          >
            <ChevronLeft className="w-4 h-4 lg:w-5 lg:h-5" />
          </button>
          <button 
            onClick={nextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 lg:w-12 lg:h-12 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-background transition-colors"
          >
            <ChevronRight className="w-4 h-4 lg:w-5 lg:h-5" />
          </button>
        </>
      )}
    </div>
  )
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

          status: "originals" as const,
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

          status: "waitlist" as const,
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

          status: "echo" as const,
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
      <section className="relative min-h-screen flex items-center px-4 bg-gradient-to-br from-background via-background to-muted/30">
        <div className="container max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[calc(100vh-80px)]">
            {/* Left Content */}
            <div className="space-y-6 lg:space-y-8 text-left order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 text-accent text-sm font-medium uppercase tracking-wide">
                Urban Edge
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
                  Àníkẹ́ Bákàrè
                  <br />
                  <span className="text-primary">Limited Editions</span>
                </h1>
                <p className="text-lg lg:text-xl text-muted-foreground max-w-lg">
                  Prepaid. Made-to-order. No overproduction.
                  <br />
                  <span className="font-medium">Secure your piece before it's gone forever.</span>
                </p>
              </div>

              <div className="pt-4">
                <Button size="lg" className="px-8 py-3 text-base font-medium" asChild>
                  <Link href="/products">
                    Discover Now
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right Content - Hero Image */}
            <HeroImageCarousel />
          </div>
        </div>
      </section>

      {/* New Arrivals Section */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="container max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">New Arrivals</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Each piece is made only after you pay. Production begins when you secure your order.
            </p>
            

          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-muted rounded-lg mb-4"></div>
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
              {featuredProducts.concat(featuredProducts).slice(0, 8).map((product, index) => (
                <div key={`${product._id}-${index}`} className="group">
                  <div className="bg-card rounded-lg overflow-hidden border hover:shadow-lg transition-shadow">
                    <Link href={`/product/${product._id}`}>
                      <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center relative overflow-hidden">
                        {product.images && product.images.length > 0 ? (
                          <img 
                            src={product.images[0]} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center text-muted-foreground">
                            <div className="w-16 h-16 mx-auto mb-2 bg-muted-foreground/20 rounded-full flex items-center justify-center">
                              <Sparkles className="w-8 h-8" />
                            </div>
                            <p className="text-sm">Product</p>
                          </div>
                        )}
                        {product.status === "waitlist" && (
                          <div className="absolute top-3 left-3">
                            <Badge variant="secondary" className="bg-accent text-accent-foreground text-xs">
                              Waitlist
                            </Badge>
                          </div>
                        )}
                        {product.status === "originals" && (
                          <div className="absolute top-3 left-3">
                            <Badge className="bg-primary text-primary-foreground text-xs">
                              Available
                            </Badge>
                          </div>
                        )}
                      </div>
                    </Link>
                    
                    <div className="p-3 space-y-2">
                      <div className="text-center">
                        <h3 className="font-medium text-sm mb-1">{product.name}</h3>
                        <p className="text-sm font-bold">₦{(product.basePrice / 100).toFixed(0)}</p>
                      </div>
                      
                      {/* Quick Action Button */}
                      {product.status === "waitlist" && (
                        <Button className="w-full" size="sm" asChild>
                          <Link href={`/product/${product._id}`}>
                            Join Waitlist
                          </Link>
                        </Button>
                      )}
                      
                      {product.status === "originals" && (
                        <Button className="w-full" size="sm" asChild>
                          <Link href={`/product/${product._id}`}>
                            Buy Now
                          </Link>
                        </Button>
                      )}
                      
                      {product.status === "echo" && (
                        <Button variant="outline" className="w-full" size="sm" asChild>
                          <Link href={`/product/${product._id}`}>
                            Request
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Collections */}
      {/* <section className="py-20 px-4">
        <div className="container max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Left Collection */}
            {/* <div className="relative h-[500px] rounded-2xl overflow-hidden group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/80 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <div className="w-24 h-24 mx-auto mb-4 bg-muted-foreground/20 rounded-full flex items-center justify-center">
                    <Sparkles className="w-12 h-12" />
                  </div>
                  <p className="text-lg">Collection Image</p>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-8 left-8 text-white">
                <p className="text-sm font-medium mb-2 uppercase tracking-wide">Ethical Elegance</p>
                <h3 className="text-3xl font-bold mb-4">Where Dreams<br />Meet Couture</h3>
                <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white hover:text-black">
                  Shop Now
                </Button>
              </div>
            </div> */}

            {/* Right Collection */}
            {/* <div className="relative h-[500px] rounded-2xl overflow-hidden group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/30 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <div className="w-24 h-24 mx-auto mb-4 bg-muted-foreground/20 rounded-full flex items-center justify-center">
                    <Sparkles className="w-12 h-12" />
                  </div>
                  <p className="text-lg">Collection Image</p>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-8 left-8 text-white">
                <p className="text-sm font-medium mb-2 uppercase tracking-wide">Modern Royalty</p>
                <h3 className="text-3xl font-bold mb-4">Enchanting Styles<br />for Every Woman</h3>
                <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white hover:text-black">
                  Shop Now
                </Button>
              </div>
            </div> */}
          {/* </div> */}

          {/* Bottom Collections */}
          {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mt-6 lg:mt-8">
            {/* Urban Streetwear */}
            {/* <div className="relative h-[300px] rounded-2xl overflow-hidden group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/30 to-secondary/40 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <div className="w-16 h-16 mx-auto mb-2 bg-muted-foreground/20 rounded-full flex items-center justify-center">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <p className="text-sm">Footwear</p>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 text-white">
                <p className="text-xs font-medium mb-1 uppercase tracking-wide">Urban Streetwear</p>
                <h3 className="text-xl font-bold mb-2">Chic Footwear for<br />City Living</h3>
                <Button size="sm" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white hover:text-black text-xs">
                  Shop Now
                </Button>
              </div>
            </div> */}

            {/* Trendsetting Bags */}
            {/* <div className="relative h-[300px] rounded-2xl overflow-hidden group cursor-pointer bg-primary">
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <div className="text-center">
                  <h3 className="text-4xl font-bold mb-4">Trendsetting Bags for Her</h3>
                  <div className="text-6xl font-bold mb-4">50<span className="text-2xl">%</span></div>
                  <Button className="bg-white text-primary hover:bg-white/90">
                    Shop Now
                  </Button>
                </div>
              </div>
            </div> */}
          {/* </div> */}
        {/* </div> */}
      {/* </section> */}
      
      <Footer />
    </div>
  )
}

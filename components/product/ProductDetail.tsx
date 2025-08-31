"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { calculatePhasePrice, formatPrice, getDiscountLabel } from "@/lib/pricing"
import { Clock, Users, ShoppingCart, Mail, AlertCircle, Percent, Star, CheckCircle } from "lucide-react"

interface ProductDetailProps {
  product: {
    _id: string
    name: string
    sku: string
    description?: string
    basePrice: number
    images: string[]
    status: "waitlist" | "originals" | "echo"
    variants: Array<{
      color: string
      material: string
      stock: number
    }>
    phases: {
      waitlist?: { startDate: string; endDate?: string }
      originals?: { startDate: string; endDate?: string; earlyBirdDiscount: number }
      echo?: { startDate: string; endDate?: string }
    }
    launchDate?: string
  }
  user?: {
    priorityClub?: boolean
    waitlistPosition?: number
    email?: string
  }
}

export default function ProductDetail({ product, user }: ProductDetailProps) {
  const [selectedVariant, setSelectedVariant] = useState(0)
  const [email, setEmail] = useState(user?.email || "")
  const [isLoading, setIsLoading] = useState(false)
  const [joinedEntry, setJoinedEntry] = useState<null | { position: number; status: string }>(null)
  const { toast } = useToast()

  // Ensure we have a safe variants array and a fallback currentVariant to avoid runtime errors
  const variants = product.variants || []
  const currentVariant = variants[selectedVariant] ?? variants[0] ?? { color: "", material: "", stock: 0 }

  const pricingResult = calculatePhasePrice(
    product.basePrice,
    product.status,
    user,
    product.launchDate ? new Date(product.launchDate) : new Date(),
  )

  const handleWaitlistJoin = async () => {
    // If user is signed in, use token-authenticated endpoint and avoid client-side email requirement
    const token = localStorage.getItem("token")

    if (!email && !token) {
      toast({
        title: "Email required",
        description: "Please enter your email to join the waitlist",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          // only include email for guest joins
          ...(token ? {} : { email }),
          productId: product._id,
          variantId: currentVariant.color ? `${currentVariant.color}-${currentVariant.material}` : undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Joined waitlist!",
          description: `You're #${data.position} in line. We'll notify you when available.`,
        })
  setJoinedEntry({ position: data.position, status: "active" })
        setEmail("")
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to join waitlist",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Check whether the signed-in user already joined this product's waitlist
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) return

    ;(async () => {
      try {
        const resp = await fetch("/api/user/waitlist", { headers: { Authorization: `Bearer ${token}` } })
        if (!resp.ok) return
        const data = await resp.json()
        if (!Array.isArray(data)) return

        const match = data.find((entry: any) => {
          if (!entry.productId) return false
          // productId may be populated or an id string depending on API
          const pid = typeof entry.productId === "object" ? entry.productId._id || entry.productId.id : entry.productId
          if (!pid) return false
          if (pid.toString() !== product._id.toString()) return false
          // If variantId provided, compare; otherwise accept any variant match
          if (entry.variantId && currentVariant.color) {
            const vid = `${currentVariant.color}-${currentVariant.material}`
            return entry.variantId === vid
          }
          return true
        })

        if (match) {
          setJoinedEntry({ position: match.position, status: match.status })
        }
      } catch (e) {
        // ignore
      }
    })()
  }, [product._id, currentVariant])

  const handleAddToCart = async () => {
    if (variants.length === 0) {
      toast({
        title: "No variants available",
        description: "This product currently has no variants available to purchase.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          productId: product._id,
          variantId: currentVariant.color ? `${currentVariant.color}-${currentVariant.material}` : undefined,
          quantity: 1,
          pricing: pricingResult,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Added to cart!",
          description: "Redirecting to checkout...",
        })
        window.location.href = `/checkout/${data.orderId}`
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to add to cart",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = () => {
    switch (product.status) {
      case "waitlist":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3 mr-1" />
            Waitlist
          </Badge>
        )
      case "originals":
        return (
          <Badge variant="default" className="bg-primary text-primary-foreground">
            <ShoppingCart className="w-3 h-3 mr-1" />
            Available Now
          </Badge>
        )
      case "echo":
        return (
          <Badge variant="outline" className="border-orange-200 text-orange-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Echo Phase
          </Badge>
        )
    }
  }

  const getActionSection = () => {
    switch (product.status) {
      case "waitlist":
        // If user already joined, show their position/status
        if (joinedEntry) {
          return (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="h-6 w-6 text-primary" />
                  <div>
                    <h3 className="font-semibold">You're on the waitlist</h3>
                    <p className="text-sm text-muted-foreground">Position #{joinedEntry.position}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">We'll notify you via email when this product becomes available.</p>
              </CardContent>
            </Card>
          )
        }

        return (
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                Join the waitlist to be notified when available
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Expected Price</span>
                  <Badge variant="outline" className="text-xs">
                    <Percent className="w-3 h-3 mr-1" />
                    Early Bird Discount
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-primary">{formatPrice(product.basePrice * 0.8)}</span>
                  <span className="text-sm text-muted-foreground line-through">{formatPrice(product.basePrice)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Estimated 20% early bird discount when originals phase launches
                </p>
              </div>

              {user?.priorityClub && (
                <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
                  <Star className="w-4 h-4 text-primary" />
                  <span className="text-sm text-primary font-medium">
                    Priority Club member - guaranteed early access
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <Button onClick={handleWaitlistJoin} disabled={isLoading} className="w-full">
                <Mail className="w-4 h-4 mr-2" />
                {isLoading ? "Joining..." : "Join Waitlist"}
              </Button>
            </CardContent>
          </Card>
        )

      case "originals":
        return (
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-bold text-primary">{formatPrice(pricingResult.finalPrice)}</span>
                      {pricingResult.discount > 0 && (
                        <span className="text-lg text-muted-foreground line-through">
                          {formatPrice(product.basePrice)}
                        </span>
                      )}
                    </div>
                    {pricingResult.discount > 0 && (
                      <div className="flex items-center gap-2">
                        <Badge className="bg-accent text-accent-foreground">
                          <Percent className="w-3 h-3 mr-1" />
                          {pricingResult.discount}% OFF
                        </Badge>
                        <span className="text-sm text-accent font-medium">
                          {getDiscountLabel(pricingResult.discountReason, pricingResult.discount)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {pricingResult.discount > 0 && (
                  <div className="bg-accent/10 p-3 rounded-lg">
                    <p className="text-sm font-medium text-accent">
                      You save {formatPrice(product.basePrice - pricingResult.finalPrice)}
                    </p>
                  </div>
                )}

                {user?.priorityClub && (
                  <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
                    <Star className="w-4 h-4 text-primary" />
                    <span className="text-sm text-primary font-medium">Priority Club discount applied</span>
                  </div>
                )}
              </div>

              <div className="text-sm text-muted-foreground">Only {currentVariant.stock ?? 0} left in stock</div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleAddToCart}
                disabled={!variants.length || isLoading}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {variants.length === 0 ? "Unavailable" : isLoading ? "Adding..." : `Add to Cart - ${formatPrice(pricingResult.finalPrice)}`}
              </Button>

              {pricingResult.discountReason === "early_bird" && (
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <p className="text-sm text-orange-800 font-medium">⏰ Early bird pricing ends in 3 days</p>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case "echo":
        return (
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="text-center space-y-2">
                <AlertCircle className="w-8 h-8 mx-auto text-orange-500" />
                <h3 className="font-semibold">Echo Phase</h3>
                <p className="text-sm text-muted-foreground">Request this variant and we'll try to source it for you</p>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-lg font-bold">{formatPrice(pricingResult.finalPrice)}</span>
                  {pricingResult.discount > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {pricingResult.discount}% off
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Escrow protected - pay only when item is sourced</p>
              </div>

              <Button variant="outline" className="w-full bg-transparent">
                Request This Item - {formatPrice(pricingResult.finalPrice)}
              </Button>
            </CardContent>
          </Card>
        )
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square relative rounded-lg overflow-hidden bg-muted">
              <Image
                src={product.images[0] || "/placeholder.svg?height=600&width=600"}
                alt={product.name}
                fill
                className="object-cover"
              />
              {pricingResult.discount > 0 && product.status !== "waitlist" && (
                <div className="absolute top-4 left-4">
                  <Badge className="bg-accent text-accent-foreground text-lg px-3 py-1">
                    <Percent className="w-4 h-4 mr-1" />
                    {pricingResult.discount}% OFF
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div className="space-y-2">
              {getStatusBadge()}
              <h1 className="text-3xl font-bold text-balance">{product.name}</h1>
              <p className="text-muted-foreground">SKU: {product.sku}</p>
            </div>

            {product.description && <p className="text-muted-foreground leading-relaxed">{product.description}</p>}

            {/* Variant Selection */}
            <div className="space-y-4">
              <Label>Select Variant</Label>
              {variants.length === 0 ? (
                <div className="text-sm text-muted-foreground">No variants available for this product</div>
              ) : (
                <Select
                  value={selectedVariant.toString()}
                  onValueChange={(value) => setSelectedVariant(Number.parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {variants.map((variant, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {variant.color} {variant.material} ({variant.stock ?? 0} available)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Action Section */}
            {getActionSection()}
          </div>
        </div>
      </div>
    </div>
  )
}

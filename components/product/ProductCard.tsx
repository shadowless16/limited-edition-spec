"use client"

import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, Users, Percent } from "lucide-react"
import { calculatePhasePrice, formatPrice, getDiscountLabel } from "@/lib/pricing"
import Link from "next/link"

interface ProductCardProps {
  product: {
    id: string
    name: string
    sku: string
    basePrice: number
    images: string[]
    status: "waitlist" | "originals" | "echo" | "ended"
    variants: Array<{
      color: string
      material: string
      stock: number
    }>
    launchDate?: string
    tags?: string[]
  }
  waitlistPosition?: number
  user?: { priorityClub?: boolean; waitlistPosition?: number }
}

export default function ProductCard({ product, waitlistPosition, user }: ProductCardProps) {
  const pricingResult = calculatePhasePrice(
    product.basePrice,
    product.status,
    { ...user, waitlistPosition },
    product.launchDate ? new Date(product.launchDate) : undefined,
  )

  const getStatusBadge = () => {
    switch (product.status) {
      case "waitlist":
        return (
          <Badge variant="secondary" className="bg-accent text-accent-foreground">
            Waitlist Open
          </Badge>
        )
      case "originals":
        return (
          <Badge variant="default" className="bg-primary text-primary-foreground">
            Originals Live
          </Badge>
        )
      case "echo":
        return <Badge variant="outline">Echo Phase</Badge>
      case "ended":
        return (
          <Badge variant="secondary" className="bg-muted text-muted-foreground">
            Ended
          </Badge>
        )
      default:
        return null
    }
  }

  const getActionButton = () => {
    switch (product.status) {
      case "waitlist":
        return (
          <Button className="w-full" size="lg" asChild>
            <Link href={`/product/${product.id}`}>
              {waitlistPosition ? `Position #${waitlistPosition}` : "Join Waitlist"}
            </Link>
          </Button>
        )
      case "originals":
        return (
          <Button className="w-full" size="lg" asChild>
            <Link href={`/product/${product.id}`}>Buy Now - {formatPrice(pricingResult.finalPrice)}</Link>
          </Button>
        )
      case "echo":
        return (
          <Button variant="outline" className="w-full bg-transparent" size="lg" asChild>
            <Link href={`/product/${product.id}`}>Request Echo</Link>
          </Button>
        )
      case "ended":
        return (
          <Button variant="secondary" className="w-full" size="lg" disabled>
            Sold Out
          </Button>
        )
      default:
        return null
    }
  }

  const totalStock = product.variants.reduce((sum, variant) => sum + variant.stock, 0)

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <Link href={`/product/${product.id}`} className="block">
      <div className="relative aspect-square">
        <Image
          src={product.images[0] || "/placeholder.svg?height=400&width=400&query=limited edition product"}
          alt={product.name}
          fill
          className="object-cover"
        />
        <div className="absolute top-3 left-3">{getStatusBadge()}</div>
        {totalStock <= 10 && totalStock > 0 && (
          <div className="absolute top-3 right-3">
            <Badge variant="destructive" className="text-xs">
              Only {totalStock} left
            </Badge>
          </div>
        )}
        {pricingResult.discount > 0 && product.status !== "waitlist" && (
          <div className="absolute bottom-3 left-3">
            <Badge className="bg-accent text-accent-foreground">
              <Percent className="h-3 w-3 mr-1" />
              {pricingResult.discount}% OFF
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-4">
        <div>
          <h3 className="font-semibold text-lg text-balance">{product.name}</h3>
          <p className="text-sm text-muted-foreground">{product.sku}</p>
          {product.tags && product.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {product.tags.map((t) => (
                <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {pricingResult.discount > 0 && product.status !== "waitlist" ? (
                <>
                  <span className="text-2xl font-bold text-primary">{formatPrice(pricingResult.finalPrice)}</span>
                  <span className="text-sm text-muted-foreground line-through">{formatPrice(product.basePrice)}</span>
                </>
              ) : (
                <span className="text-2xl font-bold">{formatPrice(product.basePrice)}</span>
              )}
            </div>
            {pricingResult.discount > 0 && product.status !== "waitlist" && (
              <p className="text-xs text-accent font-medium">
                {getDiscountLabel(pricingResult.discountReason, pricingResult.discount)}
              </p>
            )}
          </div>
        </div>

        {/* Variant Colors Preview */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Colors:</span>
          <div className="flex gap-1">
            {product.variants.slice(0, 4).map((variant, index) => (
              <div
                key={index}
                className="w-4 h-4 rounded-full border border-border"
                style={{
                  backgroundColor:
                    variant.color.toLowerCase() === "black"
                      ? "#000"
                      : variant.color.toLowerCase() === "white"
                        ? "#fff"
                        : variant.color.toLowerCase() === "brown"
                          ? "#8B4513"
                          : variant.color.toLowerCase() === "blue"
                            ? "#0066cc"
                            : variant.color.toLowerCase() === "gray"
                              ? "#666"
                              : "#ccc",
                }}
              />
            ))}
            {product.variants.length > 4 && (
              <span className="text-xs text-muted-foreground">+{product.variants.length - 4}</span>
            )}
          </div>
        </div>

        {/* Status Info */}
        {product.status === "waitlist" && waitlistPosition && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>Est. notification in 3-5 days</span>
          </div>
        )}

        {product.status === "echo" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Echo window closes in 15 days</span>
          </div>
        )}

        {user?.priorityClub && (
          <div className="flex items-center gap-2 text-sm text-primary">
            <Badge variant="outline" className="text-xs">
              Priority Club
            </Badge>
            <span>Extra savings applied</span>
          </div>
        )}

        {getActionButton()}
      </CardContent>
      </Link>
    </Card>
  )
}

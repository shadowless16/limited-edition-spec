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
    return null // Remove action buttons for cleaner grid layout
  }

  const totalStock = product.variants.reduce((sum, variant) => sum + variant.stock, 0)

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group border-0 bg-transparent">
      <Link href={`/product/${product.id}`} className="block">
      <div className="relative aspect-square rounded-lg overflow-hidden mb-4">
        <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <div className="w-16 h-16 mx-auto mb-2 bg-muted-foreground/20 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 bg-muted-foreground/40 rounded" />
            </div>
            <p className="text-sm">Product Image</p>
          </div>
        </div>
        
        {product.status === "waitlist" && (
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-accent text-accent-foreground text-xs">
              Waitlist
            </Badge>
          </div>
        )}
        {totalStock <= 10 && totalStock > 0 && product.status === "originals" && (
          <div className="absolute top-3 right-3">
            <Badge variant="destructive" className="text-xs">
              Only {totalStock} left
            </Badge>
          </div>
        )}
        {pricingResult.discount > 0 && product.status !== "waitlist" && (
          <div className="absolute bottom-3 left-3">
            <Badge className="bg-primary text-primary-foreground text-xs">
              {pricingResult.discount}% OFF
            </Badge>
          </div>
        )}
      </div>

      <div className="text-center space-y-2">
        <h3 className="font-medium text-sm group-hover:text-primary transition-colors">{product.name}</h3>
        <div className="flex items-center justify-center gap-2">
          {pricingResult.discount > 0 && product.status !== "waitlist" ? (
            <>
              <span className="text-sm font-bold text-primary">{formatPrice(pricingResult.finalPrice)}</span>
              <span className="text-xs text-muted-foreground line-through">{formatPrice(product.basePrice)}</span>
            </>
          ) : (
            <span className="text-sm font-medium">{formatPrice(product.basePrice)}</span>
          )}
        </div>
        
        {product.status === "originals" && (
          <div className="flex justify-center">
            <div className="flex">
              {[1,2,3,4,5].map((star) => (
                <svg key={star} className="w-3 h-3 text-primary fill-current" viewBox="0 0 20 20">
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                </svg>
              ))}
            </div>
          </div>
        )}
        
        {product.status === "waitlist" && waitlistPosition && (
          <p className="text-xs text-muted-foreground">Position #{waitlistPosition}</p>
        )}
      </div>
      </Link>
    </Card>
  )
}

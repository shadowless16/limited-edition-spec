"use client"

import { useState } from "react"
import Header from "@/components/layout/Header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Clock, Users, Bell, CheckCircle } from "lucide-react"
import Link from "next/link"
import { formatPrice } from "@/lib/pricing"

// Mock data - replace with actual API calls
const waitlistProducts = [
  {
    id: "2",
    name: "Minimalist Watch",
    sku: "MW-S2-SL1",
    basePrice: 45900,
    images: ["/minimalist-luxury-watch.png"],
    status: "waitlist" as const,
    waitlistCount: 247,
    estimatedLaunch: "2024-02-15",
    variants: [
      { color: "silver", material: "steel", stock: 25 },
      { color: "black", material: "steel", stock: 20 },
    ],
  },
  {
    id: "5",
    name: "Artisan Coffee Mug",
    sku: "CM-C5-WH1",
    basePrice: 3900,
    images: ["/handcrafted-ceramic-coffee-mug.png"],
    status: "waitlist" as const,
    waitlistCount: 89,
    estimatedLaunch: "2024-02-20",
    variants: [
      { color: "white", material: "ceramic", stock: 50 },
      { color: "black", material: "ceramic", stock: 30 },
    ],
  },
]

export default function WaitlistPage() {
  const [emailByProduct, setEmailByProduct] = useState<Record<string, string>>({})

  const handleJoin = async (productId: string) => {
    const email = emailByProduct[productId]
    if (!email) return alert("Enter an email first")

    try {
      const resp = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, email })
      })
      if (resp.ok) {
        alert('Joined waitlist — we will notify you')
        setEmailByProduct({ ...emailByProduct, [productId]: '' })
      } else {
        const data = await resp.json().catch(() => ({}))
        alert(data.error || 'Failed to join waitlist')
      }
    } catch (err) {
      alert('Network error')
    }
  }
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container max-w-6xl mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Join the Waitlist</h1>
          <p className="text-lg text-muted-foreground text-pretty max-w-2xl mx-auto">
            Be the first to know when our exclusive limited-edition products become available. Get early access and
            special pricing.
          </p>
        </div>

        {/* How Waitlist Works */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">Join for Free</h3>
              <p className="text-sm text-muted-foreground">
                Add your email to secure your spot in line. No payment required.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                <Bell className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">Get Notified</h3>
              <p className="text-sm text-muted-foreground">Receive email alerts when the originals phase launches.</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">Early Access</h3>
              <p className="text-sm text-muted-foreground">
                Get priority access and early bird pricing when products launch.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Waitlist Products */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-center">Current Waitlist Products</h2>

          {waitlistProducts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No products in waitlist</h3>
                <p className="text-muted-foreground text-center mb-4">Check back soon for new limited edition drops.</p>
                <Button asChild>
                  <Link href="/products">Browse All Products</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {waitlistProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/3">
                      <img
                        src={product.images[0] || "/placeholder.svg"}
                        alt={product.name}
                        className="w-full h-48 md:h-full object-cover"
                      />
                    </div>
                    <div className="md:w-2/3 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold mb-1">{product.name}</h3>
                          <p className="text-lg font-semibold text-primary">{formatPrice(product.basePrice)}</p>
                        </div>
                        <Badge variant="secondary">Waitlist</Badge>
                      </div>

                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{product.waitlistCount} people waiting</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>Estimated launch: {new Date(product.estimatedLaunch).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor={`email-${product.id}`} className="text-sm font-medium">
                            Email Address
                          </Label>
                          <Input
                            id={`email-${product.id}`}
                            type="email"
                            placeholder="Enter your email"
                            className="mt-1"
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button className="flex-1">Join Waitlist</Button>
                          <Button variant="outline" asChild>
                            <Link href={`/product/${product.id}`}>View Details</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Benefits Section */}
        <div className="mt-16 bg-muted/30 rounded-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-4">Waitlist Benefits</h2>
            <p className="text-muted-foreground">Join our waitlist and enjoy exclusive perks when products launch.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold">10%</span>
              </div>
              <h3 className="font-semibold mb-2">Early Bird Discount</h3>
              <p className="text-sm text-muted-foreground">Save 10-20% off regular pricing</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">Priority Access</h3>
              <p className="text-sm text-muted-foreground">Get first access before public launch</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4">
                <Bell className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">Launch Notifications</h3>
              <p className="text-sm text-muted-foreground">Email alerts for all phase transitions</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">Guaranteed Spot</h3>
              <p className="text-sm text-muted-foreground">Reserved access to limited quantities</p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How does the waitlist work?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Join for free and we'll notify you when products become available. Waitlist members get priority
                  access and early bird pricing when the originals phase launches.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Is there a cost to join?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  No, joining the waitlist is completely free. You only pay when you decide to purchase during the
                  originals phase.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">When will I be notified?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  You'll receive email notifications 24-48 hours before the originals phase launches, giving you time to
                  prepare for your purchase.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I leave the waitlist?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes, you can unsubscribe from waitlist notifications at any time using the link in our emails or by
                  contacting support.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

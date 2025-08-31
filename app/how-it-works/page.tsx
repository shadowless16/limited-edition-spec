import Header from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Users, ShoppingBag, Shield, Bell, CreditCard } from "lucide-react"
import Link from "next/link"

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container max-w-4xl mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">How Limited Drops Work</h1>
          <p className="text-lg text-muted-foreground text-pretty">
            Our three-phase system ensures fair access to exclusive, limited-edition products
          </p>
        </div>

        {/* Three Phases */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <div className="w-16 h-16 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold text-2xl mx-auto mb-4">
                1
              </div>
              <CardTitle className="text-xl">Waitlist Phase</CardTitle>
              <CardDescription>Join early, get notified first</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Join the waitlist for free</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span>Get notified when originals phase starts</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Early access to purchase</span>
              </div>
            </CardContent>
          </Card>

          <Card className="text-center border-primary">
            <CardHeader>
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-2xl mx-auto mb-4">
                2
              </div>
              <CardTitle className="text-xl">Originals Phase</CardTitle>
              <CardDescription>Limited quantities, early bird pricing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                <span>Purchase available products</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span>Early bird discount pricing</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>First come, first served</span>
              </div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-16 h-16 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-2xl mx-auto mb-4">
                3
              </div>
              <CardTitle className="text-xl">Echo Phase</CardTitle>
              <CardDescription>Request specific variants with escrow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span>Escrow protection</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Request specific variants</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Fulfillment when available</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Explanation */}
        <div className="space-y-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Waitlist Phase Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Join the waitlist for any upcoming product drop. This is completely free and gives you priority access
                when the originals phase begins. You'll receive email notifications and can track your position in the
                queue.
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>Free to join, no commitment required</li>
                <li>Email notifications for phase transitions</li>
                <li>Priority access to originals phase</li>
                <li>Track your waitlist position</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Originals Phase Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                When products become available, waitlist members get first access to purchase at early bird pricing.
                Stock is limited and available on a first-come, first-served basis.
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>Early bird discount pricing (typically 10-20% off)</li>
                <li>Limited quantities available</li>
                <li>Secure payment processing</li>
                <li>Certificate of Authenticity included</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Echo Phase Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Missed out on the originals phase? Request specific product variants in the echo phase with escrow
                protection. Your payment is held securely until the product becomes available.
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>Request specific colors, materials, or sizes</li>
                <li>Escrow payment protection</li>
                <li>Fulfillment when products become available</li>
                <li>Full refund if request cannot be fulfilled</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button size="lg" asChild>
            <Link href="/products">Browse Current Drops</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
